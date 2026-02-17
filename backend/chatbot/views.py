from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from chatbot.rag.rag_chain import answer_with_rag
from chatbot.llm_router import LLMRouterError
# Create your views here.

class ChatAskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "question is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = answer_with_rag(question)
            return Response(result, status=status.HTTP_200_OK)
        except LLMRouterError as e:
            return Response(
                {"detail": "AI service temporarily unavailable", "error": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Instead of crashing with 500 your API returns a clean “service unavailable”
        

def chat_page(request):
        return render(request, "chatbot/chat.html")

