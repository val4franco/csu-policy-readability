import boto3
import json
import os
import base64

# Constants
REGION = "us-west-2"
VECTOR_BUCKET = "embed"
VECTOR_INDEX = "policies"  # <-- replace with your actual index name
LLM_MODEL_ID = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"

# Clients
s3v = boto3.client("s3vectors", region_name=REGION)
bedrock = boto3.client("bedrock-runtime", region_name=REGION)

def embed_text_titan(text):
    response = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({
            "inputText": text
        }),
        contentType="application/json",
        accept="application/json"
    )
    body = json.loads(response['body'].read())
    return body['embedding']

def query_vector_index(embedding, top_k=3, metadata_filter=None):
    query_body = {
        "vectorBucketName": VECTOR_BUCKET,
        "indexName": VECTOR_INDEX,
        "queryVector": {"float32": embedding},
        "topK": top_k,
        "returnMetadata": True,
        "returnDistance": True,
    }
    if metadata_filter:
        query_body["filter"] = {"area": metadata_filter}

    response = s3v.query_vectors(**query_body)
    return response["vectors"]

def generate_answer_with_bedrock(query, top_chunks):
    context_texts = [
        chunk.get("metadata", {}).get("text", "")
        for chunk in top_chunks if chunk.get("metadata")
    ]
    context_combined = "\n\n---\n\n".join(context_texts)

    system_prompt = [
        {
            "text": "You are an AI assistant helping CSU employees understand systemwide policy documents. Answer questions using only the given excerpts. Be clear, concise, and helpful. Be friendly and understanding. If they just state their name, just say hello and how you can help."
        }
    ]

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "text": f"Context:\n\n{context_combined}\n\nQuestion: {query}"
                }
            ]
        }
    ]

    print(messages)


    response = bedrock.converse(
        modelId=LLM_MODEL_ID,
        system=system_prompt,
        messages=messages,
        inferenceConfig={
            "temperature": 0.3,
            "maxTokens": 1024,
            "topP": 0.9
        }
    )

    return response["output"]["message"]["content"][0]["text"]

def lambda_handler(event, context):
    print(event)
    try:
        
        print(type(event))
        #query = event.get("queryStringParameters", {}).get("query")
        #area = event.get("queryStringParameters", {}).get("area")
        query = event.get("query") 
        area = event.get("area") 

        embedding = embed_text_titan(query)
        if area is None:
            top_chunks = query_vector_index(embedding, top_k=5)
        else:
            top_chunks = query_vector_index(embedding, top_k=5, metadata_filter=area)
        print(top_chunks)

        generated_answer = generate_answer_with_bedrock(query, top_chunks)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "answer": generated_answer
            }),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            }),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
