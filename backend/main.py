"""
FastAPI Backend Application for AI Crop Disease Detection
"""

import os
from typing import Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from fruit_diseases_db import (
    FRUIT_DISEASE_DB,
    get_disease_by_id,
    list_all_crops
)

from model_inference import classifier, CLASS_NAMES

from llm_assistant import generate_chat_response

from database import (
    plant_scans_collection,
    test_database_connection
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Crop Disease Detection API",
    description="Computer Vision & LLM Backend for Crop Leaf Disease Diagnosis and Care",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class ChatRequest(BaseModel):
    prompt: str
    disease_context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    source: str


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": "AI Crop Disease Detection API",
        "crop_focus": (
            "Crops (Wheat, Rice, Corn, Tomato, Potato, Cotton, "
            "Soybean, Apple, Grape and more)"
        ),
        "version": "1.0.0",
        "docs_url": "/docs"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health_check():

    mongodb_connected = test_database_connection()

    return {
        "status": "healthy",
        "model_loaded": classifier.is_trained_model_loaded,
        "mongodb_connected": mongodb_connected,

        "inference_engine": (
            "PyTorch MobileNetV2"
            if classifier.is_trained_model_loaded
            else "Computer Vision Feature Inspector"
        ),

        "supported_classes_count": len(CLASS_NAMES),

        "supported_crops": list_all_crops()
    }


# ============================================================
# FRUIT CROPS
# ============================================================

@app.get("/api/fruit-crops")
def get_fruit_crops():

    return {
        "crops": list_all_crops(),
        "diseases_count": len(FRUIT_DISEASE_DB),
        "disease_database": FRUIT_DISEASE_DB
    }


# ============================================================
# CROP DISEASE PREDICTION
# ============================================================

@app.post("/api/predict")
async def predict_crop_disease(file: UploadFile = File(...)):
    """
    Accepts an uploaded plant leaf image,
    performs AI classification,
    saves the prediction to MongoDB,
    and returns the diagnostic report.
    """

    # --------------------------------------------------------
    # Check uploaded file type
    # --------------------------------------------------------

    if not file.content_type or not file.content_type.startswith("image/"):

        raise HTTPException(
            status_code=400,
            detail="File uploaded must be an image (JPEG, PNG, WEBP)."
        )

    try:

        # ----------------------------------------------------
        # Read uploaded image
        # ----------------------------------------------------

        contents = await file.read()

        if len(contents) == 0:

            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )

        # ----------------------------------------------------
        # Run AI model prediction
        # ----------------------------------------------------

        prediction_result = classifier.predict(
            contents,
            filename=file.filename
        )

        # ----------------------------------------------------
        # Save prediction to MongoDB
        # ----------------------------------------------------

        scan_record = {
            "filename": file.filename,
            "content_type": file.content_type,
            "prediction": prediction_result
        }

        scan_id = None

        if plant_scans_collection is not None:
            insert_result = plant_scans_collection.insert_one(scan_record)
            scan_id = str(insert_result.inserted_id)

        # ----------------------------------------------------
        # Return prediction to frontend
        # ----------------------------------------------------

        return {
            "success": True,
            "scan_id": scan_id,
            "filename": file.filename,
            "data": prediction_result
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Image processing failed: {str(e)}"
        )


# ============================================================
# GET SAVED PLANT SCANS
# ============================================================

@app.get("/api/scans")
def get_scans():
    """
    Returns the latest saved plant scans from MongoDB.
    """

    try:

        scans = list(
            plant_scans_collection
            .find()
            .sort("_id", -1)
            .limit(50)
        )

        # Convert MongoDB ObjectId to string
        for scan in scans:
            scan["_id"] = str(scan["_id"])

        return {
            "success": True,
            "count": len(scans),
            "scans": scans
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve scans: {str(e)}"
        )


# ============================================================
# GET SINGLE SCAN
# ============================================================

@app.get("/api/scans/{scan_id}")
def get_single_scan(scan_id: str):
    """
    Returns one saved scan using its MongoDB ID.
    """

    from bson import ObjectId
    from bson.errors import InvalidId

    try:

        object_id = ObjectId(scan_id)

    except InvalidId:

        raise HTTPException(
            status_code=400,
            detail="Invalid scan ID."
        )

    scan = plant_scans_collection.find_one(
        {"_id": object_id}
    )

    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found."
        )

    scan["_id"] = str(scan["_id"])

    return {
        "success": True,
        "scan": scan
    }


# ============================================================
# PLANT ASSISTANT CHAT
# ============================================================

@app.post("/api/chat", response_model=ChatResponse)
def plant_assistant_chat(request: ChatRequest):
    """
    Handles user questions about plant care,
    treatments, and prevention using Gemini LLM
    with agricultural fallback.
    """

    if not request.prompt or not request.prompt.strip():

        raise HTTPException(
            status_code=400,
            detail="Prompt cannot be empty."
        )

    try:

        reply = generate_chat_response(
            prompt=request.prompt.strip(),
            disease_context=request.disease_context
        )

        api_key_present = bool(
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        )

        return ChatResponse(
            response=reply,

            source=(
                "Gemini 2.5 Flash"
                if api_key_present
                else "Fruit Crop Expert System"
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Chatbot service error: {str(e)}"
        )


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )