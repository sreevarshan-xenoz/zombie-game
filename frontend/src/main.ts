import './style.css'
import anime from 'animejs/lib/anime.es.js'

// Game constants
const GAME_WIDTH = 1280
const GAME_HEIGHT = 720
const PLAYER_SPEED = 5
const ZOMBIE_SPEED = 2
const BULLET_SPEED = 15
const MAX_HEALTH = 100
const DAMAGE_PER_HIT = 10

// Game state
interface GameState {
  score: number
  health: number
  ammo: number
  isGameRunning: boolean
  zombies: Zombie[]
  bullets: Bullet[]
  player: Player
  lastFrameTime: number
  spawnInterval: number
  lastSpawnTime: number
}

// Initialize canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
canvas.width = GAME_WIDTH
canvas.height = GAME_HEIGHT

// Load assets
const playerImage = new Image()
playerImage.src = '/assets/player.png'
const zombieImage = new Image()
zombieImage.src = '/assets/zombie.png'

// UI elements
const startScreen = document.getElementById('start-screen')!
const gameOverScreen = document.getElementById('game-over-screen')!
const startButton = document.getElementById('start-button')!
const restartButton = document.getElementById('restart-button')!
const scoreElement = document.getElementById('score')!
const finalScoreElement = document.getElementById('final-score')!
const healthFill = document.getElementById('health-fill')!
const ammoCounter = document.getElementById('ammo-counter')!

// Classes
class Vector2 {
  constructor(public x: number, public y: number) {}

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y)
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y)
  }

  normalize(): Vector2 {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y)
    return new Vector2(this.x / magnitude, this.y / magnitude)
  }

  scale(factor: number): Vector2 {
    return new Vector2(this.x * factor, this.y * factor)
  }

  distance(other: Vector2): number {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
    )
  }
}

class Entity {
  position: Vector2
  size: Vector2
  
  constructor(x: number, y: number, width: number, height: number) {
    this.position = new Vector2(x, y)
    this.size = new Vector2(width, height)
  }

  get centerX(): number {
    return this.position.x + this.size.x / 2
  }

  get centerY(): number {
    return this.position.y + this.size.y / 2
  }

  intersects(other: Entity): boolean {
    return (
      this.position.x < other.position.x + other.size.x &&
      this.position.x + this.size.x > other.position.x &&
      this.position.y < other.position.y + other.size.y &&
      this.position.y + this.size.y > other.position.y
    )
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'red'
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y)
  }
}

class Bullet extends Entity {
  velocity: Vector2
  
  constructor(x: number, y: number, vx: number, vy: number) {
    super(x, y, 5, 5)
    this.velocity = new Vector2(vx, vy)
  }

  update(deltaTime: number): boolean {
    this.position = this.position.add(this.velocity)
    
    // Check if bullet is out of bounds
    if (
      this.position.x < 0 ||
      this.position.x > GAME_WIDTH ||
      this.position.y < 0 ||
      this.position.y > GAME_HEIGHT
    ) {
      return true
    }
    
    // Check for collision with zombies
    for (let i = 0; i < gameState.zombies.length; i++) {
      if (this.intersects(gameState.zombies[i])) {
        if (gameState.zombies[i].takeDamage(50)) {
          gameState.score += 10
          gameState.zombies.splice(i, 1)
          updateUI()
        }
        return true
      }
    }
    
    return false
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(this.centerX, this.centerY, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

class Zombie extends Entity {
  speed: number
  health: number
  
  constructor(x: number, y: number) {
    super(x, y, 40, 40)
    this.speed = ZOMBIE_SPEED
    this.health = 100
  }

  update(deltaTime: number): void {
    // Move towards player
    const direction = gameState.player.position
      .add(new Vector2(gameState.player.size.x / 2, gameState.player.size.y / 2))
      .subtract(this.position.add(new Vector2(this.size.x / 2, this.size.y / 2)))
      .normalize()
      
    this.position = this.position.add(direction.scale(this.speed))
    
    // Check for collision with player
    if (this.intersects(gameState.player)) {
      gameState.health -= DAMAGE_PER_HIT * (deltaTime / 1000)
      updateUI()
      
      if (gameState.health <= 0) {
        endGame()
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(
      zombieImage,
      this.position.x,
      this.position.y,
      this.size.x,
      this.size.y
    )
  }

  takeDamage(damage: number): boolean {
    this.health -= damage
    
    // Create blood splatter effect
    const blood = document.createElement('div')
    blood.className = 'blood-splatter'
    document.getElementById('game-container')!.appendChild(blood)
    
    blood.style.position = 'absolute'
    blood.style.left = `${this.centerX}px`
    blood.style.top = `${this.centerY}px`
    blood.style.width = '20px'
    blood.style.height = '20px'
    blood.style.backgroundColor = '#8a0303'
    blood.style.borderRadius = '50%'
    blood.style.transform = 'translate(-50%, -50%)'
    blood.style.zIndex = '2'
    
    anime({
      targets: blood,
      opacity: [1, 0],
      scale: [1, 3],
      duration: 500,
      easing: 'easeOutQuad',
      complete: () => {
        blood.remove()
      }
    })
    
    return this.health <= 0
  }
}

class Player extends Entity {
  velocity: Vector2
  rotation: number
  reloadTime: number
  isReloading: boolean
  
  constructor(x: number, y: number) {
    super(x, y, 50, 50)
    this.velocity = new Vector2(0, 0)
    this.rotation = 0
    this.reloadTime = 0
    this.isReloading = false
  }

  update(deltaTime: number): void {
    this.position = this.position.add(this.velocity)
    
    // Constrain player to canvas
    this.position.x = Math.max(0, Math.min(GAME_WIDTH - this.size.x, this.position.x))
    this.position.y = Math.max(0, Math.min(GAME_HEIGHT - this.size.y, this.position.y))
    
    if (this.isReloading) {
      this.reloadTime -= deltaTime
      if (this.reloadTime <= 0) {
        this.isReloading = false
        gameState.ammo = 30
        updateUI()
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.centerX, this.centerY)
    ctx.rotate(this.rotation)
    ctx.drawImage(
      playerImage,
      -this.size.x / 2,
      -this.size.y / 2,
      this.size.x,
      this.size.y
    )
    ctx.restore()
  }

  reload(): void {
    if (!this.isReloading && gameState.ammo < 30) {
      this.isReloading = true
      this.reloadTime = 2000 // 2 seconds reload time
    }
  }

  shoot(): void {
    if (gameState.ammo > 0 && !this.isReloading) {
      gameState.ammo--
      updateUI()
      
      const bulletX = this.centerX + Math.cos(this.rotation) * 30
      const bulletY = this.centerY + Math.sin(this.rotation) * 30
      
      const bullet = new Bullet(
        bulletX,
        bulletY,
        Math.cos(this.rotation) * BULLET_SPEED,
        Math.sin(this.rotation) * BULLET_SPEED
      )
      
      gameState.bullets.push(bullet)
      
      // Add muzzle flash effect with anime.js
      const flash = document.createElement('div')
      flash.className = 'muzzle-flash'
      document.getElementById('game-container')!.appendChild(flash)
      
      flash.style.position = 'absolute'
      flash.style.left = `${bulletX}px`
      flash.style.top = `${bulletY}px`
      flash.style.width = '10px'
      flash.style.height = '10px'
      flash.style.backgroundColor = '#fff'
      flash.style.borderRadius = '50%'
      flash.style.transform = 'translate(-50%, -50%)'
      flash.style.zIndex = '5'
      
      anime({
        targets: flash,
        opacity: [1, 0],
        scale: [1, 3],
        duration: 200,
        easing: 'easeOutQuad',
        complete: () => {
          flash.remove()
        }
      })
    } else if (gameState.ammo === 0 && !this.isReloading) {
      this.reload()
    }
  }
}

// Game state initialization
const gameState: GameState = {
  score: 0,
  health: MAX_HEALTH,
  ammo: 30,
  isGameRunning: false,
  zombies: [],
  bullets: [],
  player: new Player(GAME_WIDTH / 2 - 25, GAME_HEIGHT / 2 - 25),
  lastFrameTime: 0,
  spawnInterval: 2000, // 2 seconds
  lastSpawnTime: 0
}

// Game functions
function updateUI() {
  scoreElement.textContent = `Score: ${gameState.score}`
  healthFill.style.width = `${(gameState.health / MAX_HEALTH) * 100}%`
  ammoCounter.textContent = gameState.player.isReloading 
    ? 'RELOADING...' 
    : gameState.ammo.toString()
}

function endGame() {
  gameState.isGameRunning = false
  finalScoreElement.textContent = gameState.score.toString()
  gameOverScreen.classList.remove('hidden')
  
  // Add screen shake effect
  anime({
    targets: '#game-container',
    translateX: [
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: 0, duration: 100 }
    ],
    easing: 'easeInOutSine'
  })
}

// Input handling
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  r: false
}

window.addEventListener('keydown', (event) => {
  switch(event.key.toLowerCase()) {
    case 'w': keys.w = true; break;
    case 'a': keys.a = true; break;
    case 's': keys.s = true; break;
    case 'd': keys.d = true; break;
    case 'r': gameState.player.reload(); break;
  }
})

window.addEventListener('keyup', (event) => {
  switch(event.key.toLowerCase()) {
    case 'w': keys.w = false; break;
    case 'a': keys.a = false; break;
    case 's': keys.s = false; break;
    case 'd': keys.d = false; break;
  }
})

window.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  const dx = mouseX - gameState.player.centerX
  const dy = mouseY - gameState.player.centerY
  
  gameState.player.rotation = Math.atan2(dy, dx)
})

window.addEventListener('mousedown', (event) => {
  if (event.button === 0 && gameState.isGameRunning) {
    gameState.player.shoot()
  }
})

// Game functions
function startGame() {
  gameState.score = 0
  gameState.health = MAX_HEALTH
  gameState.ammo = 30
  gameState.isGameRunning = true
  gameState.zombies = []
  gameState.bullets = []
  gameState.player = new Player(GAME_WIDTH / 2 - 25, GAME_HEIGHT / 2 - 25)
  gameState.lastFrameTime = performance.now()
  gameState.lastSpawnTime = performance.now()
  
  startScreen.classList.add('hidden')
  gameOverScreen.classList.add('hidden')
  
  updateUI()
  
  // Start game loop
  requestAnimationFrame(gameLoop)
}

function spawnZombie() {
  let x, y
  // Spawn zombies from outside the screen
  const side = Math.floor(Math.random() * 4) // 0: top, 1: right, 2: bottom, 3: left
  
  switch(side) {
    case 0: // top
      x = Math.random() * GAME_WIDTH
      y = -50
      break
    case 1: // right
      x = GAME_WIDTH + 50
      y = Math.random() * GAME_HEIGHT
      break
    case 2: // bottom
      x = Math.random() * GAME_WIDTH
      y = GAME_HEIGHT + 50
      break
    case 3: // left
      x = -50
      y = Math.random() * GAME_HEIGHT
      break
    default:
      x = -50
      y = -50
  }
  
  gameState.zombies.push(new Zombie(x, y))
}

function gameLoop(currentTime: number) {
  if (!gameState.isGameRunning) return
  
  const deltaTime = currentTime - gameState.lastFrameTime
  gameState.lastFrameTime = currentTime
  
  // Update player input
  const playerSpeed = PLAYER_SPEED
  gameState.player.velocity.x = 0
  gameState.player.velocity.y = 0
  
  if (keys.w) gameState.player.velocity.y -= playerSpeed
  if (keys.a) gameState.player.velocity.x -= playerSpeed
  if (keys.s) gameState.player.velocity.y += playerSpeed
  if (keys.d) gameState.player.velocity.x += playerSpeed
  
  // If moving diagonally, normalize velocity to prevent faster diagonal movement
  if (gameState.player.velocity.x !== 0 && gameState.player.velocity.y !== 0) {
    const normalized = gameState.player.velocity.normalize()
    gameState.player.velocity = normalized.scale(playerSpeed)
  }
  
  // Spawn zombies
  if (currentTime - gameState.lastSpawnTime > gameState.spawnInterval) {
    spawnZombie()
    gameState.lastSpawnTime = currentTime
    
    // Gradually decrease spawn interval for difficulty increase
    gameState.spawnInterval = Math.max(500, gameState.spawnInterval - 50)
  }
  
  // Update game entities
  gameState.player.update(deltaTime)
  
  for (let i = gameState.zombies.length - 1; i >= 0; i--) {
    gameState.zombies[i].update(deltaTime)
  }
  
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    if (gameState.bullets[i].update(deltaTime)) {
      gameState.bullets.splice(i, 1)
    }
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  
  // Draw grid background
  ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)'
  ctx.lineWidth = 1
  
  const gridSize = 50
  for (let x = 0; x < GAME_WIDTH; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, GAME_HEIGHT)
    ctx.stroke()
  }
  
  for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(GAME_WIDTH, y)
    ctx.stroke()
  }
  
  // Draw entities
  gameState.player.draw(ctx)
  
  for (const zombie of gameState.zombies) {
    zombie.draw(ctx)
  }
  
  for (const bullet of gameState.bullets) {
    bullet.draw(ctx)
  }
  
  // Continue game loop
  requestAnimationFrame(gameLoop)
}

// Event listeners for game buttons
startButton.addEventListener('click', startGame)
restartButton.addEventListener('click', startGame)

// Make sure assets are loaded before starting
let assetsLoaded = 0
const totalAssets = 2 // player + zombie images

function checkAllAssetsLoaded() {
  assetsLoaded++
  if (assetsLoaded === totalAssets) {
    // Create an assets directory if it doesn't exist
    fetch('/api/ensure-assets-directory', { method: 'POST' })
      .catch(err => console.error('Failed to create assets directory:', err))
  }
}

playerImage.onload = checkAllAssetsLoaded
zombieImage.onload = checkAllAssetsLoaded

// Error handling for missing assets
playerImage.onerror = () => {
  playerImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADnUlEQVR4nO2ZW4hNURjHf2MYGpdhXGY0JMbtkMtEuTx4ICoPSCkvlHJ5kVKUlylFeRmUXEq5lSjlUl48eBCKF0QMQi4ZJBli3MZl/Gtttjmz9z6XfdbZx5xf7Yd99vr+6//tb31r7W9tKEDAP/wAHgLpdP/AOe/q0rpmO2n6A5fd6Z7vQDVQk94CnATGAuOA4+ltwCbgmDvtiUqcvkAf4G16NFDtTjtWiTMeWAosdKc9qcRZDhwCNrrTnlTiTAP2ADPcaU8rcRYAJ4DF7nRmDFKSdUEU/M+kkjHCTyXOKOAGMA1odmXo4JbxS5ntqTRilSAdXfq02Rq+AfMNOiZzuQJcBSqATmXkLAVeAwP0wG9gRYksZzzTYNpmwCtgaZztVmASsB/4CfwC9gGTY9nOYKPO+Qj0AeYCu2K+S4GvxifMfuA5cBE4B6w15NVp+5ZYgkGGvG+Agba+I4xvJeAO8BQ4Akyp4DqrBV3N7Aw1b2B8phu+9bG2R9pWZfhm6/NhQ02RW/G5kAR7gGv6YJ+2yVH1eSH7Aaq0TYZPVpRvwCPtl1hnB9AVOAt8MK7Ga6AI+AgMNeR1ULlXdWO9DzxTncV0lK1ZorLLQB9DY2fDaMyOOB5QpQ8y/Qr5j8CtMuT6CiwAXpS41m3ALmCjjmihx6dNsV/Hqyzx2mh6/CcgKWIbNd0xZCgb9zT9Umy1SbuW6TBG76PAvGKSCgTYyBukbogkCQTIQ29XE0tKgnkj5CAQwEYgSI5AEA86ao38VW1SBBF1RI2/JMcasTLRlX7bHF8KkSB7kiBdhRoHq2gjFr4BPSx9K4HNNgeRILW6ezaR9eZG2BzdLNKIXLTyWsdNwH3gXIVHtxB5hm+rKW8a03gqmIrcdCRH1/8kSCv9nUfIQeJfL7vXyC4gvz34pgjRy0M+UogcfZaDQJAcP0p0VIKYqHM8vgJBDEixrwJ+e8gZCJIjadJGfpN2RtJl/QJgNTA7KSPN0hbpUdlDzlIj3Bn4A5TrCbkQM/Kw3lXbvZY0YhtpIb+QZ/tMjzjzfXO0mG1XR2pJcgJ0t3TI8jC/Sn5RX8jpZqPxiP8deG/pKxdtbwbGWPqWa5qP2jrkM4rN+XKM/lK33WYOxxBJ4+1znUggVc/LMYmXry9pMDPaAnIe4bk4Fxv0MoQcPb7pNdp6kMrHRKKvOTRJFwsCEpj/DmHTTY+kkj6uAAAAAElFTkSuQmCC'
  checkAllAssetsLoaded()
}

zombieImage.onerror = () => {
  zombieImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD2ElEQVR4nO2ZTYhWVRTHf6OjJimVH02kRZqVElaURB9QRC1aFBIl0SoXtWpTixZB7XJRi1pEELSJoKJNQUQFUUSLiIo+IIoiLUqzj5npZ/+4B/5v7n3fffPO+76ZeR7+cHnvPffce/733I9zzn0QEhISEhIS8v9EMzAIjDq+DNwLrAUeAi5jmmMusBP4FZgAJieMHcAmYGaaQ7MWOBG8fNz4Gvgs+H4+cBXwJvBnDvhkHARmTVMsrtIYGWPANuByYA5wE/AW8AvwuJOZ7eR+axCjvwJLgKuBG4B3gD+A54DLnMw8J/uz42lnl6rTGOCxGo0BeBDYAfwGvApsdTBPAd84+S+AUz3/eaBd/O1xY5Ojzw6S84uBe4DDwPsuON9zYw9wXcJvNrMbadAAOYvADSkylzjrmnGeA96vQ+YKYJmtEXmGW+oJdq0QS+iLZmBVBrL/BJrAdSmy5zgLFRnWlbfcr+1WuNGJU3AqH9F1JVeHZkqMldYCQ6Z5yKyTb71lZLN87wZm1kG03+J0LbAG2EudqFbmU+DnYDwPfAM8ClxVixLdzvB9wHxgF3ArMCcn97BjNIQtUKvEt06xLcCCOrgVOAB8ZIt8CLgDWEEJiGq1UGW1kD5jEmsrWKRaiyRxoTnOzV5jnM19qVaJSu5VjWU2Ood4qoJ7BYgbq3zcq2p6VYuo2+pUK51FHgaeAV4CfrT2LxVFv1aZMsrMB74D9gPLJyhzjdO5vQKLTCpuAu4DDlm8N2IFsK0Cp0+EJm8aZrQTXyvw+p1O4ZxmcYi6GDlcgNz1bkFD3i9GoTJVa2aFNbsYXrdAHsjCbSKHWl1ZvW0tcFPGmrw/K7f4oF/HInVUJCH1Ov0b8P6oBcrLI4dcUSprSf+0f1cMukUUmXcJCHvDSCrZV/LcBHxZsKA1cojOzLmuQ0TbVXOv3gpNY5w7Zb17xRF8ooJFBlwt6s7gUv1uW1TqIlkRn0N0Tz0XitPhqK2oiF8DmzNc+CzNYqd1gK+WcC9F5FvbnG9K4V4q+FeXcK9t7kLXeZM0i9vt7KE+wLtMN3DQHFk93J3BXbHlX4U6QFfOGnNVjH9nKN1P2jnG+NcRXLcaJx2g4mNchHk7jjHd5pOxJaWPkLXuAp4HDpnr/G6lv2+HN5trtZqIz11WfvVFe7G1goOWd3i36XJt5h+2G/BudZbla3K7Tne4oLV6iKmIJnd4S7MrbgP1jTJPH5vsbmGtZeXdTGKLROZulchbx7DLQ4ILxYSEhISETB/8DVW8OaPL7gUuAAAAAElFTkSuQmCC'
  checkAllAssetsLoaded()
}

// Create placeholder for zombie.svg icon
const zombie = document.createElement('link')
zombie.rel = 'icon'
zombie.type = 'image/svg+xml'
zombie.href = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTIyLDNIMTlDMTkuOCw1LjcgMTkuNyw2LjgzIDE4LDlMMjAsOUwxOSwxMkMyMiwxMCAyMywyLjQgMjIsMk0xMS43NCw5Ljk0QzEyLjY3LDkuNjEgMTMuMSw4LjUzIDEyLjc3LDcuNkMxMi40NCw2LjY3IDExLjM2LDYuMjQgMTAuNDMsNi41N0M5LjUsNi45IDkuMDcsNy45OCA5LjQsOC45MUM5LjczLDkuODQgMTAuODEsMTAuMjcgMTEuNzQsOS45NE0xMS41OCwxOS4yOEw5Ljk4LDIySDUuNjVDNS45LDIwLjc1IDcsMTkuODQgOC4wOCwxOS4yNUMxMC4yMSwxOC4xOSAxMS4yLDE2LjA2IDExLjU4LDE5LjI4TTE0LjYzLDUuNUw5LjUsMTBDOSwxMCA4Ljc1LDkuNSA4LjUsOUM0LjQ2LDEzLjA0IDQuMTIsMTYuMjUgNC4xMiwxOC41NkMxLjQsMTguNTYgMiwxMy43NSAyLDEyLjVDMiw5LjA2IDMuNjMsNi4yIDUuNSw0SDEuNUwzLDFIMTZMMTUuNSw0TDE0LDYuNVYxNUMyMSwxNC41IDE4LDkgMTQuNjMsNS41TTEzLDE4Ljk0QzEzLjcsMTguOTQgMTcuMzIsMTguODYgMTUsMTcuNUMxNC41NSwxNy4xNyAxMy4zMywxNi40NCAxMiwxMy41QzExLjMxLDE1LjQ2IDEwLjM2LDE4Ljk0IDEzLDE4Ljk0WiIgZmlsbD0iI2ZmNDA0MCIvPjwvc3ZnPg=='
document.head.appendChild(zombie)

// Create asset directory and placeholder images
const createAssets = async () => {
  try {
    // We would normally create an API endpoint for this
    console.log('Asset loading simulation only. In a real app, you would need to create an API endpoint to handle asset creation.')
  } catch (error) {
    console.error('Error creating assets:', error)
  }
}

createAssets()
