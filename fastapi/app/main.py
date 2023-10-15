from typing import Union
from fastapi import FastAPI
from dotenv import load_dotenv
import cohere
import os
import json
from pydantic import BaseModel
from googletrans import Translator

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")

app = FastAPI()
co = cohere.Client(COHERE_API_KEY)
translator = Translator()


class ReqBody(BaseModel):
    query: str
    docs: list


class TranslateBody(BaseModel):
    text: str
    targetLanguage: str


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/rerank")
def rerankDocs(body: ReqBody):
    print("BODY", body)
    if len(body.docs) < 1:
        return {"docs": body.docs}
    results = co.rerank(
        query=body.query, documents=body.docs, top_n=5, model="rerank-multilingual-v2.0"
    )
    print("RESULT", results)
    # results = map(lambda r: r.document["text"], results)
    return {"docs": results}


@app.post("/translate")
def translate(body: TranslateBody):
    print("BODY", body)
    response = translator.translate(body.text, dest=body.targetLanguage)
    return {"text": response.text, "detectedLanguage": response.src}
