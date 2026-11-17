from django.db import models
class GameRecord(models.Model):
    white_player=models.CharField(max_length=80,default="White")
    black_player=models.CharField(max_length=80,default="Black")
    result=models.CharField(max_length=30,default="In progress")
    pgn=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering=["-created_at"]
    def __str__(self):
        return f"{self.white_player} vs {self.black_player} ({self.result})"
