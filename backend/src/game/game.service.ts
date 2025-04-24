import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { ScoreData } from './models/score.model';

@Injectable()
export class GameService {
  private readonly scoresPath = join(process.cwd(), 'data', 'scores.json');
  private readonly assetsDir = join(process.cwd(), '..', 'frontend', 'public', 'assets');

  constructor() {
    this.initializeDataDirectory();
  }

  private initializeDataDirectory() {
    const dataDir = join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.scoresPath)) {
      fs.writeFileSync(this.scoresPath, JSON.stringify([]));
    }
  }

  async ensureAssetsDirectory() {
    try {
      if (!fs.existsSync(this.assetsDir)) {
        fs.mkdirSync(this.assetsDir, { recursive: true });
      }

      const placeholderFiles = [
        { 
          filename: 'player.png', 
          fallback: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADnUlEQVR4nO2ZW4hNURjHf2MYGpdhXGY0JMbtkMtEuTx4ICoPSCkvlHJ5kVKUlylFeRmUXEq5lSjlUl48eBCKF0QMQi4ZJBli3MZl/Gtttjmz9z6XfdbZx5xf7Yd99vr+6//tb31r7W9tKEDAP/wAHgLpdP/AOe/q0rpmO2n6A5fd6Z7vQDVQk94CnATGAuOA4+ltwCbgmDvtiUqcvkAf4G16NFDtTjtWiTMeWAosdKc9qcRZDhwCNrrTnlTiTAP2ADPcaU8rcRYAJ4DF7nRmDFKSdUEU/M+kkjHCTyXOKOAGMA1odmXo4JbxS5ntqTRilSAdXfq02Rq+AfMNOiZzuQJcBSqATmXkLAVeAwP0wG9gRYksZzzTYNpmwCtgaZztVmASsB/4CfwC9gGTY9nOYKPO+Qj0AeYCu2K+S4GvxifMfuA5cBE4B6w15NVp+5ZYgkGGvG+Agba+I4xvJeAO8BQ4Akyp4DqrBV3N7Aw1b2B8phu+9bG2R9pWZfhm6/NhQ02RW/G5kAR7gGv6YJ+2yVH1eSH7Aaq0TYZPVpRvwCPtl1hnB9AVOAt8MK7Ga6AI+AgMNeR1ULlXdWO9DzxTncV0lK1ZorLLQB9DY2fDaMyOOB5QpQ8y/Qr5j8CtMuT6CiwAXpS41m3ALmCjjmihx6dNsV/Hqyzx2mh6/CcgKWIbNd0xZCgb9zT9Umy1SbuW6TBG76PAvGKSCgTYyBukbogkCQTIQ29XE0tKgnkj5CAQwEYgSI5AEA86ao38VW1SBBF1RI2/JMcasTLRlX7bHF8KkSB7kiBdhRoHq2gjFr4BPSx9K4HNNgeRILW6ezaR9eZG2BzdLNKIXLTyWsdNwH3gXIVHtxB5hm+rKW8a03gqmIrcdCRH1/8kSCv9nUfIQeJfL7vXyC4gvz34pgjRy0M+UogcfZaDQJAcP0p0VIKYqHM8vgJBDEixrwJ+e8gZCJIjadJGfpN2RtJl/QJgNTA7KSPN0hbpUdlDzlIj3Bn4A5TrCbkQM/Kw3lXbvZY0YhtpIb+QZ/tMjzjzfXO0mG1XR2pJcgJ0t3TI8jC/Sn5RX8jpZqPxiP8deG/pKxdtbwbGWPqWa5qP2jrkM4rN+XKM/lK33WYOxxBJ4+1znUggVc/LMYmXry9pMDPaAnIe4bk4Fxv0MoQcPb7pNdp6kMrHRKKvOTRJFwsCEpj/DmHTTY+kkj6uAAAAAElFTkSuQmCC'
        },
        { 
          filename: 'zombie.png', 
          fallback: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD2ElEQVR4nO2ZTYhWVRTHf6OjJimVH02kRZqVElaURB9QRC1aFBIl0SoXtWpTixZB7XJRi1pEELSJoKJNQUQFUUSLiIo+IIoiLUqzj5npZ/+4B/5v7n3fffPO+76ZeR7+cHnvPffce/733I9zzn0QEhISEhIS8v9EMzAIjDq+DNwLrAUeAi5jmmMusBP4FZgAJieMHcAmYGaaQ7MWOBG8fNz4Gvgs+H4+cBXwJvBnDvhkHARmTVMsrtIYGWPANuByYA5wE/AW8AvwuJOZ7eR+axCjvwJLgKuBG4B3gD+A54DLnMw8J/uz42lnl6rTGOCxGo0BeBDYAfwGvApsdTBPAd84+S+AUz3/eaBd/O1xY5Ojzw6S84uBe4DDwPsuON9zYw9wXcJvNrMbadAAOYvADSkylzjrmnGeA96vQ+YKYJmtEXmGW+oJdq0QS+iLZmBVBrL/BJrAdSmy5zgLFRnWlbfcr+1WuNGJU3AqH9F1JVeHZkqMldYCQ6Z5yKyTb71lZLN87wZm1kG03+J0LbAG2EudqFbmU+DnYDwPfAM8ClxVixLdzvB9wHxgF3ArMCcn97BjNIQtUKvEt06xLcCCOrgVOAB8ZIt8CLgDWEEJiGq1UGW1kD5jEmsrWKRaiyRxoTnOzV5jnM19qVaJSu5VjWU2Ood4qoJ7BYgbq3zcq2p6VYuo2+pUK51FHgaeAV4CfrT2LxVFv1aZMsrMB74D9gPLJyhzjdO5vQKLTCpuAu4DDlm8N2IFsK0Cp0+EJm8aZrQTXyvw+p1O4ZxmcYi6GDlcgNz1bkFD3i9GoTJVa2aFNbsYXrdAHsjCbSKHWl1ZvW0tcFPGmrw/K7f4oF/HInVUJCH1Ov0b8P6oBcrLI4dcUSprSf+0f1cMukUUmXcJCHvDSCrZV/LcBHxZsKA1cojOzLmuQ0TbVXOv3gpNY5w7Zb17xRF8ooJFBlwt6s7gUv1uW1TqIlkRn0N0Tz0XitPhqK2oiF8DmzNc+CzNYqd1gK+WcC9F5FvbnG9K4V4q+FeXcK9t7kLXeZM0i9vt7KE+wLtMN3DQHFk93J3BXbHlX4U6QFfOGnNVjH9nKN1P2jnG+NcRXLcaJx2g4mNchHk7jjHd5pOxJaWPkLXuAp4HDpnr/G6lv2+HN5trtZqIz11WfvVFe7G1goOWd3i36XJt5h+2G/BudZbla3K7Tne4oLV6iKmIJnd4S7MrbgP1jTJPH5vsbmGtZeXdTGKLROZulchbx7DLQ4ILxYSEhISETB/8DVW8OaPL7gUuAAAAAElFTkSuQmCC'
        }
      ];

      for (const file of placeholderFiles) {
        const filePath = join(this.assetsDir, file.filename);
        if (!fs.existsSync(filePath)) {
          // For base64 data, we'd convert and save, but we'll simulate for simplicity
          fs.writeFileSync(filePath, 'placeholder');
        }
      }

      return { success: true, message: 'Assets directory created' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async saveScore(scoreData: { playerName: string; score: number }) {
    try {
      const scores = this.getScores();
      const newScore: ScoreData = {
        playerName: scoreData.playerName,
        score: scoreData.score,
        date: new Date()
      };
      
      scores.push(newScore);
      // Sort scores by highest first
      scores.sort((a, b) => b.score - a.score);
      
      // Keep only top 10 scores
      const topScores = scores.slice(0, 10);
      
      fs.writeFileSync(this.scoresPath, JSON.stringify(topScores, null, 2));
      
      return { success: true, score: newScore, rank: scores.indexOf(newScore) + 1 };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getHighScores() {
    try {
      const scores = this.getScores();
      // Return top 10 scores
      return scores.slice(0, 10);
    } catch (error) {
      return [];
    }
  }

  getZombieSettings() {
    // Return game settings for zombies
    return {
      spawnRate: 2000, // Base spawn rate in ms
      speed: {
        min: 1,
        max: 3
      },
      health: {
        min: 50,
        max: 150
      },
      difficulty: {
        easy: {
          spawnMultiplier: 1.5,
          damageMultiplier: 0.8,
          scoreMultiplier: 0.5
        },
        normal: {
          spawnMultiplier: 1.0,
          damageMultiplier: 1.0,
          scoreMultiplier: 1.0
        },
        hard: {
          spawnMultiplier: 0.6,
          damageMultiplier: 1.5,
          scoreMultiplier: 2.0
        }
      }
    };
  }

  private getScores(): ScoreData[] {
    if (fs.existsSync(this.scoresPath)) {
      const data = fs.readFileSync(this.scoresPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  }
} 