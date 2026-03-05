from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from chatbot.rag.rag_chain import answer_with_rag
from chatbot.llm_router import LLMRouterError


class ChatAskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get("question", "").strip()
        if not question:
            return Response(
                {"detail": "question is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = answer_with_rag(question)
            return Response(result, status=status.HTTP_200_OK)

        except LLMRouterError as e:
            # Both DeepSeek and WatsonX failed
            return Response(
                {
                    "detail": "AI service temporarily unavailable.",
                    "error": str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except RuntimeError as e:
            # FAISS index not found — guide the developer
            error_msg = str(e)
            if "FAISS index not found" in error_msg:
                return Response(
                    {
                        "detail": "Knowledge base not initialized. Run: python -m chatbot.rag.ingest",
                        "error": error_msg,
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return Response(
                {"detail": "Internal error.", "error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        except Exception as e:
            # Catch-all — never expose raw tracebacks to the client
            return Response(
                {
                    "detail": "An unexpected error occurred in the AI pipeline.",
                    "error": type(e).__name__,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def chat_page(request):
    return render(request, "chatbot/chat.html")