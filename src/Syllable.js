import React, { useEffect, useState } from 'react'
import paper from 'paper'
import * as opentype from 'opentype.js'

const FONT_URL =
  'https://fonts.gstatic.com/s/blackhansans/v2/ea8Aad44WunzF9a-dL6toA8r8kqYK3M.woff'
const WIDTH = 200
const HEIGHT = 200

export default () => {
  const el = React.createRef()
  const [font, setFont] = useState(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (!font) {
      opentype.load(FONT_URL, (err, font) => {
        if (err) return
        setFont(font)
      })
    }
  })

  useEffect(() => {
    if (font && el.current && !drawn) {
      paper.setup(el.current)
      const glyphs = font.stringToGlyphs('집')
      const syllable = new paper.CompoundPath()
      syllable.strokeWidth = 1.25
      syllable.strokeColor = null
      syllable.fillColor = 'black'
      glyphs.forEach(glyph => {
        let path = new paper.Path()
        glyph.path.commands.forEach(command => {
          switch (command.type) {
            case 'M':
              path = new paper.Path()
              syllable.addChild(path)
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
              path.quadraticCurveTo(
                new paper.Point(command.x1, command.y1),
                new paper.Point(command.x, command.y)
              )
              break

            case 'Z':
              path.closed = true
              break

            default:
              break
          }
        })
      })
      syllable.scale(1, -1)
      syllable.fitBounds(paper.view.bounds.expand(-10))

      const circle1 = new paper.Shape.Circle(paper.view.bounds.center, 0)
      const group1 = new paper.Group([circle1, syllable])
      group1.clipped = true
      syllable.strokeColor = 'black'
      syllable.strokeWidth = 0.5
      syllable.fillColor = null

      const syllable2 = syllable.clone()
      syllable2.strokeColor = null
      syllable2.fillColor = 'black'
      const circle2 = circle1.clone()
      const group2 = new paper.Group([circle2, syllable2])
      group2.clipped = true

      circle1.tween({ radius: WIDTH }, { duration: 500, easing: 'easeInQuad' })
      setTimeout(() => {
        circle2.tween(
          { radius: WIDTH },
          { duration: 500, easing: 'easeInQuad' }
        )
      }, 150)

      paper.view.draw()
      setDrawn(true)
    }
  })

  return (
    <canvas
      ref={el}
      width={WIDTH}
      height={HEIGHT}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)'
      }}
    />
  )
}
