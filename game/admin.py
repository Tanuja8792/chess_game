from django.contrib import admin
from .models import GameRecord
@admin.register(GameRecord)
class GameRecordAdmin(admin.ModelAdmin):
    list_display=("white_player","black_player","result","created_at")
