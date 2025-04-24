import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { GameService } from './game.service';
import { ScoreData } from './models/score.model';

@Controller('api/game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('ensure-assets-directory')
  ensureAssetsDirectory() {
    return this.gameService.ensureAssetsDirectory();
  }

  @Post('scores')
  saveScore(@Body() scoreData: { playerName: string; score: number }) {
    return this.gameService.saveScore(scoreData);
  }

  @Get('scores')
  getHighScores(): ScoreData[] {
    return this.gameService.getHighScores();
  }

  @Get('zombies/settings')
  getZombieSettings() {
    return this.gameService.getZombieSettings();
  }
} 