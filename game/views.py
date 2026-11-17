from django.shortcuts import render
from .models import GameRecord
def home(request):
    return render(request,"home.html",{"recent_games":GameRecord.objects.all()[:5]})
def play(request):
    return render(request,"chessboard.html")
