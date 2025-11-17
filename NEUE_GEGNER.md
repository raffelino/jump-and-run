# Neue Gegnertypen - Dokumentation

Dieses Dokument beschreibt alle 10 neuen Gegnertypen, die in Kathis Adventure implementiert wurden.

## Welt 1: Grasland

### JumpingEnemy (Springender Gegner)
- **Farbe**: Hellgrün (#90EE90)
- **Verhalten**: Springt alle 2 Sekunden (120 Frames) in die Höhe
- **Besonderheiten**: 
  - Bewegt sich horizontal während des Sprungs
  - Springt mit variabler Kraft (jumpPower: 10)
  - Landet sicher auf Plattformen

### ChargerEnemy (Stürmender Gegner)
- **Farbe**: Braun (#8B4513), wird orange-rot (#FF4500) beim Angriff
- **Verhalten**: Stürmt auf den Spieler zu, wenn dieser in Reichweite (5 Tiles) ist
- **Besonderheiten**:
  - Normale Geschwindigkeit: 1, Charge-Geschwindigkeit: 4.5
  - 3 Sekunden Cooldown nach jedem Charge
  - Hat Hörner/Spitzen vorne

## Welt 2: Dunkle Höhlen

### StalactiteEnemy (Stalaktit)
- **Farbe**: Grau (#696969)
- **Verhalten**: Hängt von der Decke und fällt, wenn Spieler darunter ist
- **Besonderheiten**:
  - Dreieckige Form
  - Respawnt nach 5 Sekunden (300 Frames)
  - Detektiert Spieler in 50 Pixel Radius unter sich
  - **Höhlen-exklusiv**

### BatEnemy (Fledermaus)
- **Farbe**: Lila (#4B0082) mit violetten Flügeln (#6A0DAD)
- **Verhalten**: Fliegt in Sinuskurven-Muster
- **Besonderheiten**:
  - Animierte Flügel (flattern)
  - Amplitude: 40 Pixel, Frequenz: 0.05
  - **Höhlen-exklusiv**

## Welt 3: Brennende Wüste

### FireElemental (Feuer-Elementar)
- **Farbe**: Rot-Orange-Gelb Gradient (#FF4500, #FFA500, #FFFF00)
- **Verhalten**: Bewegt sich horizontal und hinterlässt Feuer-Spuren
- **Besonderheiten**:
  - Feuer-Spur bleibt 3 Sekunden (180 Frames)
  - Flackernde Animation
  - Feuer-Spur kann Spieler verletzen
  - **Wüsten-exklusiv**

### SpinningEnemy (Wirbel-Gegner)
- **Farbe**: Sandfarben (#DEB887, #D2691E)
- **Verhalten**: Bewegt sich in Spiral-Mustern
- **Besonderheiten**:
  - Radius variiert zwischen 20 und 80 Pixeln
  - Rotiert während der Bewegung
  - Sandsturm-Wirbel Optik

## Welt 4: Eisige Berge

### SlidingEnemy (Rutschender Gegner)
- **Farbe**: Eisblau (#B0E0E6), wird hellcyan (#00FFFF) auf Eis
- **Verhalten**: Rutscht sehr schnell auf Eis-Tiles
- **Besonderheiten**:
  - Normale Geschwindigkeit: 1.5, Eis-Geschwindigkeit: 6
  - Glitzer-Effekt und Bewegungslinien bei hoher Geschwindigkeit
  - Erkennt automatisch Eis-Untergrund
  - **Eis-exklusiv**

### IcicleEnemy (Eiszapfen-Gegner)
- **Farbe**: Himmelblau (#87CEEB)
- **Verhalten**: Schießt Eis-Projektile auf den Spieler
- **Besonderheiten**:
  - Schießt alle 3 Sekunden (180 Frames)
  - Projektile fliegen zum Spieler
  - Trifft der Eiszapfen, wird Spieler verlangsamt (TODO: Slow-Effekt)
  - Eiszapfen-Projektile mit Glitzer-Effekt

## Welt 5: Himmelsburg

### CloudEnemy (Wolken-Geist)
- **Farbe**: Nebel-weiß (#F0F8FF) mit blauen Augen (#4169E1)
- **Verhalten**: Teleportiert zwischen Wolken-Plattformen
- **Besonderheiten**:
  - Teleportiert alle 3 Sekunden
  - Fade-Out/Fade-In Animation beim Teleportieren
  - Benötigt Wolken-Plattformen (Tile 'c')
  - Wolkenform aus drei Kreisen
  - **Himmel-exklusiv**

### LightningEnemy (Blitz-Gegner)
- **Farbe**: Königsblau (#4169E1), wird golden (#FFD700) beim Aufladen
- **Verhalten**: Schießt Blitze nach unten
- **Besonderheiten**:
  - 1 Sekunde Warn-Phase mit gestrichelter gelber Linie
  - Blitz trifft vertikal nach unten
  - Schießt alle 4 Sekunden (240 Frames)
  - Zickzack-Blitz-Animation mit Glow-Effekt
  - Blitz dauert 0.25 Sekunden (15 Frames)

## Technische Details

### Kollisionssystem
Alle neuen Gegner nutzen die gleiche Basis-Kollision wie bestehende Gegner:
- `checkCollision(player)` für normale Kollision
- Spezial-Kollisionen: `checkFireTrailCollision()`, `checkIcicleCollision()`, `checkLightningCollision()`

### Update-Methoden
Manche Gegner benötigen Player-Referenz für ihr Verhalten:
- ChargerEnemy: Benötigt Player-Position für Charge-Erkennung
- StalactiteEnemy: Benötigt Player-Position für Fall-Trigger
- IcicleEnemy: Benötigt Player-Position für Ziel-Berechnung
- LightningEnemy: Benötigt Player für Kollisionsprüfung

### Level-Generator Integration
Die neuen Gegner werden weltspezifisch generiert:
- Welt 1: walking, jumping, charger, flying, shooting
- Welt 2: walking, jumping, stalactite, bat, flying, shooting
- Welt 3: walking, fireElemental, spinning, flying, shooting
- Welt 4: walking, sliding, jumping, flying, shooting, icicle
- Welt 5: cloud, lightning, flying

### Performance
- Alle Gegner nutzen effiziente Animations-Techniken
- Projektile haben Lebensdauer-Limits
- Stalaktiten respawnen automatisch
- CloudEnemies begrenzen Wolken-Plattformen auf maximal 5

## Balancing

### Schwierigkeitsgrad
Die Anzahl der Gegner skaliert mit der Schwierigkeit:
- Basis-Gegner: 2 + difficulty
- Fliegende Gegner: 1 + floor(difficulty / 2)
- Spezial-Gegner: floor(difficulty / 2)
- Schießende Gegner: floor(difficulty / 3)

### Spawn-Regeln
- Gegner spawnen nicht auf Lava-Tiles
- Ground-Enemies benötigen festen Boden
- Flying-Enemies spawnen in der Luft (8-13 Tiles über Boden)
- Stalaktiten spawnen unter der Decke (Zeile 3)
- CloudEnemies benötigen mindestens 3 Wolken-Plattformen

## Zukünftige Verbesserungen
- [ ] Slow-Effekt für IcicleEnemy implementieren
- [ ] Sound-Effekte für neue Gegner
- [ ] Death-Animationen für alle neuen Gegner
- [ ] Boss-Varianten der Gegner
- [ ] Kombinations-Angriffe zwischen Gegnertypen
