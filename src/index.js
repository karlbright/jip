import paper from 'paper'
import * as opentype from 'opentype.js'
import { createStore } from 'redux'

const store = createStore((state = {}, action) => {
  switch (action.type) {
    case 'ERROR':
      return { ...state, error: action.err }
    case 'LOAD':
      return { ...state, loaded: action.loaded }
    case 'DRAW':
      return { ...state, drawn: true }
    default:
      return state
  }
})

let shape = null

function init() {
  opentype.load('https://fonts.gstatic.com/s/blackhansans/v2/ea8Aad44WunzF9a-dL6toA8r8kqYK3M.woff', (err, font) => {
    if (err) return store.dispatch({ type: 'ERROR', error: err })
    store.dispatch({ type: 'LOAD', loaded: true })
  })

  const root = document.getElementById('root')
  paper.setup(root)
  paper.view.onResize = () => store.dispatch({ type: 'RESIZE' })
}

function step() {
  const state = store.getState()
  if (state.error) throw err
  if (!state.loaded) return false
  if (!state.drawn) return draw()
  return update()
}

function draw() {
  shape = new paper.Path.Circle({
    radius: 50,
    center: paper.view.center,
    fillColor: 'red',
    fullySelected: true
  })

  store.dispatch({ type: 'DRAW' })
}

function update() {
  shape.position = paper.view.center
}

store.subscribe(step)
document.addEventListener('DOMContentLoaded', init)
