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
  }

  draw() {
    this.circle = new paper.Shape.Circle({
      radius: 0,
      center: paper.view.center,
      fillColor: 'white'
    })

    this.syllable = new Glyphs(this.font, this.string)
    this.syllable.fillColor = 'black'
    this.syllable.opacity = 0
    this.syllable.fitBounds(new paper.Rectangle(paper.view.center, this.size))
    this.syllable.applyMatrix = false
    this.syllable.position = paper.view.center
  }

  update() {
    if (this.loading) return
    this.size = Math.min(window.innerWidth / 3, window.innerHeight / 3, 250)
    this.circle.position = paper.view.center
    this.circle.radius = this.size
    this.syllable.fitBounds(new paper.Rectangle(paper.view.center, this.size))
    this.syllable.position = paper.view.center
  }

  in() {
    this.syllable.scale(1.5).opacity = 1
    this.circle.tween({ radius: this.size }, { duration: 400, easing: easing.easeBackOut })
    this.syllable.tween({ scaling: 1 }, { duration: 400, easing: easing.easeBackOut })
  }
}

class Glyphs {
  constructor(font, string) {
    this.shape = new paper.CompoundPath()
    font.stringToGlyphs(string).forEach(this.draw.bind(this))
    return this.shape
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
