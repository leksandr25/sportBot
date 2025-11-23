from bot import handle_update
import json
import asyncio

def handler(request):
    if request.method != "POST":
        return {"statusCode": 200, "body": "OK"}

    data = json.loads(request.body)
    asyncio.run(handle_update(data))

    return {
        "statusCode": 200,
        "body": "OK"
    }
