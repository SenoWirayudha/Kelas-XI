/**
 * Composite Group Transform Handler
 *
 * Single source of truth untuk semua transform composite group
 * (drag, resize, rotate). Menghilangkan dual source of truth dengan
 * memusatkan bake logic di satu fungsi.
 *
 * ── Data Model ──
 * Operator (1 item, compositeMode='mask'|'exclude')
 *   └── Members (1+ item, same groupId, compositeMode=null)
 *
 * ── State ──
 * Unbaked: operator punya compositeGroupX/Y/ScaleX/ScaleY/Rotation
 * Baked:   compositeGroup* cleared, member positions absolute
 *
 * ── Functions ──
 * bakeCompositeGroup()     — unbaked → baked
 * handleCompositeDragStart — bake + record start positions
 * handleCompositeDragEnd   — commit final positions ke React state
 * handleCompositeTransformEnd — unbaked accumulate (resize/rotate)
 * handleCompositeUngroup   — bake + clear group membership
 */

// ── helpers ──

function findOperator(items, groupId) {
  return items.find((item) =>
    item.groupId === groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude')
  )
}

// ── BAKE: compositeGroup* → absolute member positions ──

/**
 * @param {Object} opts
 * @param {string} opts.groupId - groupId dari composite group
 * @param {React.MutableRefObject<Array>} opts.itemsRef - ref ke items array
 * @param {React.MutableRefObject} opts.stageRef - ref ke Konva stage
 * @param {Object} [opts.overrides] - optional override compositeGroup* values
 * @returns {Array|null} baked member positions (dengan id, x, y, w, h, rotation) atau null jika no bake
 */
export function bakeCompositeGroup({ groupId, itemsRef, stageRef, overrides, keepGroupRotation = false }) {
  console.log('[ENTRY] bakeCompositeGroup', { groupId, hasItemsRef: !!itemsRef?.current, hasStageRef: !!stageRef?.current, keepGroupRotation })
  if (!groupId || !itemsRef?.current) return null

  const operator = findOperator(itemsRef.current, groupId)
  if (!operator) return null

  const cgx = overrides?.compositeGroupX ?? operator.compositeGroupX
  const cgy = overrides?.compositeGroupY ?? operator.compositeGroupY
  const cgsx = overrides?.compositeGroupScaleX ?? operator.compositeGroupScaleX ?? 1
  const cgsy = overrides?.compositeGroupScaleY ?? operator.compositeGroupScaleY ?? 1
  const cgr = overrides?.compositeGroupRotation ?? operator.compositeGroupRotation ?? 0

  const hasBake = (cgx || cgy || (cgsx && cgsx !== 1) || (cgsy && cgsy !== 1) || cgr)
  console.log('[BAKE] input:', { groupId, cgx, cgy, cgsx, cgsy, cgr, hasBake, keepGroupRotation, operatorId: operator.id })
  if (!hasBake) return null

  const cgxVal = cgx || 0
  const cgyVal = cgy || 0
  const cgsxVal = cgsx || 1
  const cgsyVal = cgsy || 1
  const cgrVal = cgr || 0
  const cgrRad = (cgrVal * Math.PI) / 180
  const cosR = Math.cos(cgrRad)
  const sinR = Math.sin(cgrRad)

  const members = itemsRef.current.filter((item) => item.groupId === groupId)
  console.log('[BAKE] members before:', members.map(m => ({ id: m.id, x: m.x, y: m.y, w: m.w, h: m.h, rot: m.rotation, mode: m.compositeMode })))

  const applyTransform = (mx, my, mw, mh, mrot) => {
    let bx, by
    if (cgrVal && !keepGroupRotation) {
      // Standard bake: Group reset to identity — member position in stage space
      // stageX = mx * sx * cos(r) - my * sy * sin(r) + gx
      // stageY = mx * sx * sin(r) + my * sy * cos(r) + gy
      bx = cgxVal + (mx || 0) * cgsxVal * cosR - (my || 0) * cgsyVal * sinR
      by = cgyVal + (mx || 0) * cgsxVal * sinR + (my || 0) * cgsyVal * cosR
    } else if (cgrVal && keepGroupRotation) {
      // keepGroupRotation: Group retains position AND rotation.
      // Do NOT encode cgx/cgy into bx/by — the Group stays at (cgx, cgy).
      // Members keep their local position (mx, my), only scale is baked out.
      // This prevents double-count when Konva drag places Group at _startDragPos + delta.
      bx = (mx || 0) * cgsxVal
      by = (my || 0) * cgsyVal
    } else {
      bx = cgxVal + (mx || 0) * cgsxVal
      by = cgyVal + (my || 0) * cgsyVal
    }
    return {
      x: bx,
      y: by,
      w: (cgsxVal !== 1) ? (mw || 1) * cgsxVal : mw,
      h: (cgsyVal !== 1) ? (mh || 1) * cgsyVal : mh,
      rotation: (cgrVal && !keepGroupRotation) ? (mrot || 0) + cgrVal : mrot,
    }
  }

  const bakedMembers = members.map((member) => ({
    id: member.id,
    ...applyTransform(member.x, member.y, member.w, member.h, member.rotation),
  }))
  console.log('[BAKE] bakedMembers:', bakedMembers.map(b => ({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, rot: b.rotation, keepGroupRotation })))

  // Update itemsRef.current — source of truth untuk baked state
  itemsRef.current = itemsRef.current.map((it) => {
    if (it.groupId !== groupId) return it
    const baked = it.compositeMode
      ? applyTransform(it.x, it.y, it.w, it.h, it.rotation)
      : bakedMembers.find((b) => b.id === it.id)
    if (it.compositeMode) {
      // keepGroupRotation: don't clear compositeGroupX/Y — Group keeps its stage position.
      // Operator x/y are stage-space, NOT baked (bx/by for operator would = it.x * cgsx → wrong).
      // Only bake w/h/rotation + clear compositeGroupScale.
      if (keepGroupRotation) {
        return {
          ...it,
          w: baked.w ?? it.w, h: baked.h ?? it.h,
          rotation: baked.rotation ?? it.rotation,
          compositeGroupScaleX: undefined,
          compositeGroupScaleY: undefined,
        }
      }
      return {
        ...it,
        ...baked,
        compositeGroupX: undefined,
        compositeGroupY: undefined,
        compositeGroupScaleX: undefined,
        compositeGroupScaleY: undefined,
        compositeGroupRotation: undefined,
      }
    }
    return baked
      ? { ...it, x: baked.x, y: baked.y, w: baked.w ?? it.w, h: baked.h ?? it.h, rotation: baked.rotation ?? it.rotation }
      : it
  })

  // Reset Konva Group node
  // keepGroupRotation: keep position (cgx/cgy) so Konva drag doesn't double-count.
  //                   only reset scale — member w/h absorb cgsx/cgsy.
  // !keepGroupRotation: reset everything — member positions in stage space.
  const groupNode = stageRef?.current?.findOne(`#composite-${groupId}`)
  if (groupNode) {
    groupNode.scale({ x: 1, y: 1 })
    if (keepGroupRotation) {
      groupNode.position({ x: cgxVal, y: cgyVal })
    } else {
      groupNode.position({ x: 0, y: 0 })
      groupNode.rotation(0)
    }
    if (keepGroupRotation) {
      groupNode.rotation(cgrVal)
    }
  }

  // Update member Konva nodes
  // keepGroupRotation: member positions are in Group-local space (mx*cgsx, my*cgsy).
  // !keepGroupRotation: member positions are in stage space.
  // Scale Image children di dalam per-member loop (satu path, no double-scaling)
  bakedMembers.forEach((member) => {
    const node = stageRef?.current?.findOne(`#${member.id}`)
    if (!node) return
    node.x(member.x)
    node.y(member.y)
    if (member.w !== undefined) node.width(member.w)
    if (member.h !== undefined) node.height(member.h)
    if (member.rotation !== undefined) node.rotation(member.rotation)
    // If node is a Group with an Image child (common for canvas items),
    // scale the Image node too so it renders at correct bitmap size
    if (node.nodeType === 'Group' && (cgsxVal !== 1 || cgsyVal !== 1)) {
      const imgChild = node.findOne('Image')
      if (imgChild && imgChild.width() > 0) {
        imgChild.width(Math.max(1, imgChild.width() * cgsxVal))
        imgChild.height(Math.max(1, imgChild.height() * cgsyVal))
      }
    }
  })
  groupNode?.getLayer()?.batchDraw()

  return bakedMembers
}

// ── DRAG START: bake + record start positions ──

/**
 * @param {Object} opts
 * @param {Object} opts.entry - entry dari compositeGroupMap (punya groupId, members, operatorId)
 * @param {Object} opts.event - Konva drag event (event.target punya x(), y())
 * @param {React.MutableRefObject<Array>} opts.itemsRef
 * @param {React.MutableRefObject} opts.stageRef
 * @param {React.MutableRefObject} opts.dragStartRef - ref untuk drag session data
 * @param {React.MutableRefObject<boolean>} opts.isDraggingRef
 * @param {Array<string>} [opts.externalIds=[]] - IDs item non-composite yang ikut di-drag (multi-select)
 */
export function handleCompositeDragStart({
  entry,
  event,
  itemsRef,
  stageRef,
  dragStartRef,
  isDraggingRef,
  externalIds = [],
}) {
  console.log('[ENTRY] handleCompositeDragStart', { groupId: entry?.groupId, hasEvent: !!event, hasDragStart: !!dragStartRef?.current })
  const operator = findOperator(itemsRef.current, entry.groupId)
  const hasRotation = !!(operator?.compositeGroupRotation)
  const bakedPositions = bakeCompositeGroup({
    groupId: entry.groupId,
    itemsRef,
    stageRef,
    keepGroupRotation: hasRotation,
  })

  // Record start positions — baca dari itemsRef.current (sudah baked untuk composite members)
  // Include operator so computeCompositeFinalPositions can update operator x/y/w/h
  // in React state (prevents stale unbaked operator from corrupting getItemsVisualBounds).
  const startPositions = {}
  entry.members.forEach((m) => {
    const current = itemsRef.current.find((i) => i.id === m.id)
    startPositions[m.id] = {
      x: current?.x ?? m.x ?? 0,
      y: current?.y ?? m.y ?? 0,
    }
  })
  externalIds.forEach((sid) => {
    const item = itemsRef.current.find((i) => i.id === sid)
    if (item) {
      startPositions[sid] = { x: item.x || 0, y: item.y || 0 }
    }
  })

  // Snapshot w/h/rotation at drag START so drag-end doesn't read stale itemsRef.current.
  // Always populated — when no bake needed (already baked), read absolute values from itemsRef.
  const bakedValues = bakedPositions
    ? Object.fromEntries(bakedPositions.map(b => [b.id, { w: b.w, h: b.h, rotation: b.rotation }]))
    : Object.fromEntries(
        entry.members.map((m) => {
          const cur = itemsRef.current.find((i) => i.id === m.id)
          return [m.id, { w: cur?.w, h: cur?.h, rotation: cur?.rotation }]
        }).filter(([_, v]) => v.w !== undefined || v.h !== undefined || v.rotation !== undefined)
      )
  dragStartRef.current = {
    x: event.target.x(),
    y: event.target.y(),
    startTime: Date.now(),
    moveCount: 0,
    positions: startPositions,
    posCount: Object.keys(startPositions).length,
    bakedValues,
  }
  isDraggingRef.current = true
}

// ── DRAG END: commit final positions ──

/**
 * Computes final positions after drag-end and returns them as a patches map.
 * Does NOT commit to React state — caller provides applyPatches for that.
 *
 * @param {Object} opts
 * @param {Object} opts.entry
 * @param {Object} opts.event - Konva drag event (event.target punya x(), y())
 * @param {React.MutableRefObject} opts.dragStartRef
 * @param {React.MutableRefObject<Array>} opts.itemsRef
 * @param {Object} [opts.canvasBounds] - untuk clamp eksternal items
 * @param {Function} [opts.getClampedCanvasPosition]
 * @param {Array<string>} [opts.compositeOnlyIds] - jika set, hanya member ID ini yg di-update (multi-drag case)
 * @returns {Object|null} finalPositions — { [itemId]: { x, y, w?, h?, rotation? } }
 */
export function computeCompositeFinalPositions({
  entry,
  event,
  dragStartRef,
  itemsRef,
  canvasBounds,
  getClampedCanvasPosition,
  compositeOnlyIds,
}) {
  const start = dragStartRef.current
  if (!start) return null

  const rawDx = event.target.x() - start.x
  const rawDy = event.target.y() - start.y

  const targetIds = compositeOnlyIds
    ? compositeOnlyIds
    : Object.keys(start.positions)

  console.log('[DRAG_END] compute:', { groupId: entry?.groupId, targetIds, rawDx, rawDy, startPositions: start.positions, posCount: start.posCount, compositeOnlyIds })

  const operatorItem = itemsRef.current.find((i) => i.compositeMode && i.groupId === entry.groupId)
  const isKeepGroupRotation = !!(operatorItem?.compositeGroupRotation)

  const finalPositions = {}
  targetIds.forEach((itemId) => {
    const startPos = start.positions[itemId]
    if (!startPos) return
    const isMember = entry.members.some((m) => m.id === itemId)
    if (isMember) {
      // keepGroupRotation: members stay in Group-local space (mx*cgsx, my*cgsy).
      // Only the Group's position (compositeGroupX/Y) changes. Skip member x/y update.
      // Still emit baked w/h so React state member w/h gets synced at drag-end.
      if (isKeepGroupRotation) {
        const baked = start.bakedValues?.[itemId]
        const fp = {}
        if (baked?.w !== undefined) fp.w = baked.w
        if (baked?.h !== undefined) fp.h = baked.h
        if (baked?.rotation !== undefined) fp.rotation = baked.rotation
        if (Object.keys(fp).length > 0) finalPositions[itemId] = fp
        return
      }

      // non-keepGroupRotation: members are in stage space. Apply raw stage-space delta.
      const baked = start.bakedValues?.[itemId]
      const w = baked?.w ?? itemsRef.current.find((i) => i.id === itemId)?.w
      const h = baked?.h ?? itemsRef.current.find((i) => i.id === itemId)?.h
      const rotation = baked?.rotation ?? itemsRef.current.find((i) => i.id === itemId)?.rotation
      const fp = { x: startPos.x + rawDx, y: startPos.y + rawDy }
      if (w !== undefined) fp.w = w
      if (h !== undefined) fp.h = h
      if (rotation !== undefined) fp.rotation = rotation
      finalPositions[itemId] = fp
      console.log('[DRAG_END] member final:', { itemId, startX: startPos.x, newX: fp.x, fp, bakedW: baked?.w, bakedH: baked?.h })
    } else {
      const newX = startPos.x + rawDx
      const newY = startPos.y + rawDy
      const clamped = getClampedCanvasPosition
        ? getClampedCanvasPosition(
            itemsRef.current.find((i) => i.id === itemId)?.w || 1,
            itemsRef.current.find((i) => i.id === itemId)?.h || 1,
            { x: newX, y: newY },
            canvasBounds
          )
        : { x: newX, y: newY }
      finalPositions[itemId] = { x: clamped.x, y: clamped.y }
    }
  })

  // keepGroupRotation: update operator's compositeGroupX/Y + baked w/h.
  // cgx/cgy are stage positions — rawDx/rawDy is the Group's drag delta in stage space.
  // We must also emit w/h so React state operator syncs (prevents operator/source size mismatch).
  if (isKeepGroupRotation && entry.operatorId) {
    const opBaked = start.bakedValues?.[entry.operatorId]
    const opEntry = {
      x: start.x + rawDx,  // new compositeGroupX
      y: start.y + rawDy,  // new compositeGroupY
      __keepGroupRotation: true,
    }
    if (opBaked?.w !== undefined) opEntry.w = opBaked.w
    if (opBaked?.h !== undefined) opEntry.h = opBaked.h
    if (opBaked?.rotation !== undefined) opEntry.rotation = opBaked.rotation
    finalPositions[entry.operatorId] = opEntry
  }

  return finalPositions
}

/**
 * Applies final positions to React state + itemsRef + broadcast.
 * To be called AFTER computeCompositeFinalPositions.
 *
 * @param {Object} opts
 * @param {Object} opts.finalPositions - dari computeCompositeFinalPositions
 * @param {React.MutableRefObject<Array>} opts.itemsRef
 * @param {Function} opts.applyPatches - (patches) => void, caller's setItems wrapper
 * @param {Function} [opts.broadcastItemUpdate]
 */
export function applyCompositeFinalPositions({
  finalPositions,
  itemsRef,
  applyPatches,
  broadcastItemUpdate,
}) {
  console.log('[APPLY] finalPositions:', Object.fromEntries(Object.entries(finalPositions).map(([k, v]) => [k.substring(0, 8), v])))
  console.log('[APPLY] itemsRef BEFORE:', itemsRef.current.map(i => ({ id: i.id.substring(0, 8), x: i.x, y: i.y, w: i.w, h: i.h, rot: i.rotation, cgx: i.compositeGroupX, cgsx: i.compositeGroupScaleX, cgr: i.compositeGroupRotation })))

  // Atomic commit via caller's applyPatches
  applyPatches(finalPositions)

  // Sync itemsRef.current dengan final positions
  itemsRef.current = itemsRef.current.map((item) => {
    const fp = finalPositions[item.id]
    if (!fp) return item
    if (item.compositeMode) {
      // keepGroupRotation: update compositeGroupX/Y on operator, NOT member x/y.
      if (fp.__keepGroupRotation) {
        const update = {
          ...item,
          compositeGroupX: fp.x,
          compositeGroupY: fp.y,
          compositeGroupScaleX: undefined,
          compositeGroupScaleY: undefined,
        }
        if (fp.w !== undefined) update.w = fp.w
        if (fp.h !== undefined) update.h = fp.h
        if (fp.rotation !== undefined) update.rotation = fp.rotation
        return update
      }
      // Standard bake: clear all compositeGroup* — baked into member positions.
      return {
        ...item,
        x: fp.x, y: fp.y,
        w: fp.w ?? item.w, h: fp.h ?? item.h,
        rotation: fp.rotation ?? item.rotation,
        compositeGroupX: undefined,
        compositeGroupY: undefined,
        compositeGroupScaleX: undefined,
        compositeGroupScaleY: undefined,
      }
    }
    return { ...item, x: fp.x ?? item.x, y: fp.y ?? item.y, w: fp.w ?? item.w, h: fp.h ?? item.h, rotation: fp.rotation ?? item.rotation }
  })
  console.log('[APPLY] itemsRef AFTER:', itemsRef.current.map(i => ({ id: i.id.substring(0, 8), x: i.x, y: i.y, w: i.w, h: i.h, rot: i.rotation, cgx: i.compositeGroupX, cgsx: i.compositeGroupScaleX, cgr: i.compositeGroupRotation })))

  // Broadcast ke collaborators
  if (broadcastItemUpdate && finalPositions) {
    Object.keys(finalPositions).forEach((itemId) => {
      const fp = finalPositions[itemId]
      if (!fp) return
      if (fp.__keepGroupRotation) {
        const bc = {
          compositeGroupX: fp.x,
          compositeGroupY: fp.y,
          compositeGroupScaleX: null,
          compositeGroupScaleY: null,
        }
        if (fp.w !== undefined) bc.w = fp.w
        if (fp.h !== undefined) bc.h = fp.h
        if (fp.rotation !== undefined) bc.rotation = fp.rotation
        broadcastItemUpdate(itemId, bc)
        return
      }
      const patch = { x: fp.x, y: fp.y }
      if (fp.w !== undefined) patch.w = fp.w
      if (fp.h !== undefined) patch.h = fp.h
      if (fp.rotation !== undefined) patch.rotation = fp.rotation
      const item = itemsRef.current.find((i) => i.id === itemId)
      if (item?.compositeMode) {
        patch.compositeGroupX = null
        patch.compositeGroupY = null
        patch.compositeGroupScaleX = null
        patch.compositeGroupScaleY = null
      }
      broadcastItemUpdate(itemId, patch)
    })
  }
}

/**
 * Full drag-end handler: compute + apply + reset Group.
 * Convenience wrapper for callers that have setItems directly.
 *
 * @param {Object} opts
 * @param {Object} opts.entry
 * @param {Object} opts.event
 * @param {React.MutableRefObject} opts.dragStartRef
 * @param {React.MutableRefObject<Array>} opts.itemsRef
 * @param {Function} opts.setItems - React setState
 * @param {Function} [opts.broadcastItemUpdate]
 * @param {Object} [opts.canvasBounds]
 * @param {Function} [opts.getClampedCanvasPosition]
 * @param {Array<string>} [opts.compositeOnlyIds]
 */
export function handleCompositeDragEnd(opts) {
  console.log('[ENTRY] handleCompositeDragEnd', { groupId: opts?.entry?.groupId, hasDragStart: !!opts?.dragStartRef?.current })
  const { entry, event, dragStartRef, itemsRef, setItems, broadcastItemUpdate, canvasBounds, getClampedCanvasPosition, compositeOnlyIds } = opts
  const start = dragStartRef.current
  if (!start) return

  const finalPositions = computeCompositeFinalPositions({
    entry, event, dragStartRef, itemsRef, canvasBounds, getClampedCanvasPosition, compositeOnlyIds,
  })
  if (!finalPositions) return

  applyCompositeFinalPositions({
    finalPositions,
    itemsRef,
    applyPatches: (patches) => {
      setItems((current) =>
        current.map((item) => {
          const p = patches[item.id]
          if (!p) return item
          return { ...item, ...p }
        })
      )
    },
    broadcastItemUpdate,
  })

  // Reset Group Konva node position, keep rotation
  const groupNode = event?.target
  if (groupNode && typeof groupNode.position === 'function') {
    groupNode.position({ x: 0, y: 0 })
    const opAfter = itemsRef.current.find((i) => i.compositeMode && i.groupId === entry.groupId)
    if (opAfter?.compositeGroupRotation) {
      groupNode.rotation(opAfter.compositeGroupRotation)
    }
  }
}

// ── TRANSFORM END: accumulate compositeGroup* (resize/rotate) ──

/**
 * @param {Object} opts
 * @param {Object} opts.node - Transformer node (id starts with "composite-{groupId}")
 * @param {React.MutableRefObject<Array>} opts.itemsRef
 * @param {Function} opts.updateItem - updateItem function dari Workspace
 */
export function handleCompositeTransformEnd({ node, itemsRef, updateItem }) {
  console.log('[ENTRY] handleCompositeTransformEnd', { nodeId: node?.id(), hasItemsRef: !!itemsRef?.current })
  const nid = node.id()
  if (!nid || !nid.startsWith('composite-')) return
  const groupId = nid.slice('composite-'.length)
  if (!groupId) return

  const operatorItem = itemsRef?.current
    ? itemsRef.current.find((item) =>
        item.groupId === groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude'))
    : null
  if (!operatorItem) return

  updateItem(operatorItem.id, {
    compositeGroupX: node.x(),
    compositeGroupY: node.y(),
    compositeGroupScaleX: node.scaleX(),
    compositeGroupScaleY: node.scaleY(),
    compositeGroupRotation: node.rotation(),
  })
}

// ── UNGROUP: bake + clear group membership ──

/**
 * @param {Object} opts
 * @param {string} opts.groupId
 * @param {React.MutableRefObject<Array>} opts.itemsRef
 * @param {React.MutableRefObject} opts.stageRef
 * @param {Function} opts.setItems
 * @param {Function} opts.broadcastItemUpdate
 * @param {Function} opts.captureGroupUndo
 */
export function handleCompositeUngroup({
  groupId,
  itemsRef,
  stageRef,
  setItems,
  broadcastItemUpdate,
  captureGroupUndo,
}) {
  // 1. Bake compositeGroup* → absolute member positions
  bakeCompositeGroup({ groupId, itemsRef, stageRef })

  const membersToClear = itemsRef.current.filter((i) => i.groupId === groupId)

  // 2. Capture undo
  membersToClear.forEach((item) => {
    captureGroupUndo(item.id, {
      groupId: null,
      compositeMode: null,
      compositeGroupX: undefined,
      compositeGroupY: undefined,
      compositeGroupScaleX: undefined,
      compositeGroupScaleY: undefined,
      compositeGroupRotation: undefined,
    })
  })

  // 3. Clear group membership + compositeGroup* dari React state
  setItems((current) =>
    current.map((item) => {
      if (item.groupId !== groupId) return item
      return {
        ...item,
        groupId: null,
        compositeMode: null,
        compositeGroupX: undefined,
        compositeGroupY: undefined,
        compositeGroupScaleX: undefined,
        compositeGroupScaleY: undefined,
        compositeGroupRotation: undefined,
      }
    })
  )

  // 4. Sync itemsRef.current
  itemsRef.current = itemsRef.current.map((item) => {
    if (item.groupId !== groupId) return item
    return {
      ...item,
      groupId: null,
      compositeMode: null,
      compositeGroupX: undefined,
      compositeGroupY: undefined,
      compositeGroupScaleX: undefined,
      compositeGroupScaleY: undefined,
      compositeGroupRotation: undefined,
    }
  })

  // 5. Broadcast
  if (broadcastItemUpdate) {
    membersToClear.forEach((item) => {
      broadcastItemUpdate(item.id, {
        groupId: null,
        compositeMode: null,
        compositeGroupX: null,
        compositeGroupY: null,
        compositeGroupScaleX: null,
        compositeGroupScaleY: null,
        compositeGroupRotation: null,
      })
    })
  }
}
