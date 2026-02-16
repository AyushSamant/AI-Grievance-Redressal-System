from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from chatbot.rag.rag_chain import answer_with_rag
# Create your views here.

class ChatAskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "question is required"}, status=status.HTTP_400_BAD_REQUEST)

        result = answer_with_rag(question)
        return Response(result, status=status.HTTP_200_OK)