import * as opentype from 'opentype.js'
import * as easing from 'd3-ease'
import paper from 'paper'

class Application {
  constructor(canvas, font) {
    this.canvas = canvas
    this.font = font

    paper.setup(canvas)
    this.draw()

    window.addEventListener('resize', this.update.bind(this))
  }

  draw() {
    this.background = new Background()
    this.syllable = new Syllable(this.font, '집', () => {
      this.background.in().then(this.syllable.in)
    })
  }

  update() {
    paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
    this.background.update()
    this.syllable.update()
  }
}

class Background {
  constructor() {
    this.draw()
  }

  draw() {
    this.shape = new paper.Shape.Circle({
      radius: 0,
      center: paper.view.center,
      fillColor: 'black'
    })
  }

  update() {
    this.shape.position = paper.view.center
    this.shape.radius = Math.max(window.innerHeight, window.innerWidth)
  }

  in() {
    return this.shape.tween(
      { radius: Math.max(window.innerHeight, window.innerWidth) },
      { duration: 500, easing: easing.easeCircleIn }
    )
  }
}

class Syllable {
  constructor(font, string, cb) {
    this.string = string
    this.loading = true
    this.size = Math.min(window.innerWidth / 3, window.innerHeight / 3, 250)

    opentype.load(font, (err, font) => {
      if (err) return
      this.font = font
      this.draw()
      this.loading = false
      cb()
    })

    this.in = this.in.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
  }

  draw() {
    this.circle = new paper.Shape.Circle({
      radius: 0,
      center: paper.view.center,
      fillColor: 'white'
    })
    this.circle.applyMatrix = false

    this.syllable = new Glyphs(this.font, this.string)
    this.syllable.shape.fitBounds(new paper.Rectangle(paper.view.center, this.size))
    this.syllable.shape.applyMatrix = false
    this.syllable.shape.position = paper.view.center

    this.group = new paper.Group([this.circle, this.syllable.shape])
    this.group.applyMatrix = false

    this.hitzone = new paper.Shape.Circle({
      radius: this.size,
      center: paper.view.center,
      fillColor: 'red',
      opacity: 0,
      fullySelected: false
    })
  }

  update() {
    if (this.loading) return
    this.size = Math.min(window.innerWidth / 3, window.innerHeight / 3, 250)

    this.circle.position = paper.view.center
    this.circle.radius = this.size

    this.hitzone.position = paper.view.center
    this.hitzone.radius = this.size

    this.syllable.shape.fitBounds(new paper.Rectangle(paper.view.center, this.size))
    this.syllable.shape.position = paper.view.center
  }

  in() {
    this.syllable.shape.scale(1.5).opacity = 1
    this.circle.tween({ radius: this.size }, { duration: 400, easing: easing.easeBackOut })
    this.syllable.shape.tween({ scaling: 1 }, { duration: 400, easing: easing.easeBackOut }).then(() => {
      this.hitzone.onMouseDown = this.handleMouseDown
    })
  }

  handleMouseDown(event) {
    event.stopPropagation()
    this.hitzone.onMouseLeave = this.handleMouseLeave
    this.hitzone.onMouseUp = this.handleMouseUp
    this.hitzone.onMouseDown = null
    this.group.tween({ scaling: 0.9 }, { duration: 200, easing: easing.easeBackOut.overshoot(4) })
  }

  handleMouseUp(event) {
    event.stopPropagation()
    this.hitzone.onMouseDown = null
    this.group.tween({ scaling: 1 }, { duration: 200, easing: easing.easeBackOut.overshoot(5) })
    this.syllable.shape
      .tween(
        { scaling: 1.25, rotation: [-4, 4, -5, 5, -8, 8, -10, 10][Math.floor(Math.random() * 8)] },
        { duration: 200, easing: easing.easeBackOut.overshoot(1) }
      )
      .then(() => {
        this.hitzone.onMouseDown = this.handleMouseDown
        this.syllable.shape.tween(
          { scaling: 1, rotation: 0, position: this.circle.bounds.center },
          { duration: 200, easing: easing.easeBackOut.overshoot(4) }
        )
      })
  }

  handleMouseLeave(event) {
    event.stopPropagation()
    this.hitzone.onMouseUp = null
    this.hitzone.onMouseLeave = null
    this.hitzone.onMouseDown = null
    this.group.tween({ scaling: 1 }, { duration: 200, easing: easing.easeExpOut }).then(() => {
      this.hitzone.onMouseDown = this.handleMouseDown
    })
  }
}

class Glyphs {
  constructor(font, string) {
    this.shape = new paper.CompoundPath({ fillColor: 'black', opacity: 0 })
    font.stringToGlyphs(string).forEach(this.draw.bind(this))
  }

  draw(glyph) {
    let path = new paper.Path()
    glyph.path.commands.forEach(command => {
      switch (command.type) {
        case 'M':
          path = new paper.Path()
          this.shape.addChild(path)
          path.moveTo(new paper.Point(command.x, command.y))
          break

        case 'L':
          path.add(new paper.Point(command.x, command.y))
          path.lineTo(new paper.Point(command.x, command.y))
          break

        case 'C':
          path.cubicCurveTo(
            new paper.Point(command.x1, command.y1),
            new paper.Point(command.x2, command.y2),
            new paper.Point(command.x, command.y)
          )
          break

        case 'Q':
          path.quadraticCurveTo(new paper.Point(command.x1, command.y1), new paper.Point(command.x, command.y))
          break

        case 'Z':
          path.closed = true
          break

        default:
          break
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('root')
  const font = 'https://fonts.gstatic.com/s/blackhansans/v2/ea8Aad44WunzF9a-dL6toA8r8kqYK3M.woff'
  new Application(canvas, font)
})
