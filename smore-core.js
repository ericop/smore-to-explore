(() => {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sum(list, selector = (value) => value) {
    return list.reduce((total, entry, index) => total + selector(entry, index), 0);
  }

  function unique(list) {
    return [...new Set(list)];
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function pickWeighted(list, weightSelector = (value) => value.weight || 1) {
    const totalWeight = sum(list, (entry) => Math.max(0, weightSelector(entry)));
    if (!list.length || totalWeight <= 0) return list[0] || null;

    let roll = Math.random() * totalWeight;
    for (const entry of list) {
      roll -= Math.max(0, weightSelector(entry));
      if (roll <= 0) return entry;
    }
    return list[list.length - 1];
  }

  function rotateEdges(edges, rotation = 0) {
    const turns = ((rotation % 4) + 4) % 4;
    if (turns === 0) return { ...edges };

    let rotated = { ...edges };
    for (let index = 0; index < turns; index += 1) {
      rotated = {
        north: rotated.west,
        east: rotated.north,
        south: rotated.east,
        west: rotated.south
      };
    }
    return rotated;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  function pointInRect(point, rect) {
    return !!rect &&
      point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h;
  }

  function insetRect(rect, inset) {
    if (typeof inset === "number") {
      return { x: rect.x + inset, y: rect.y + inset, w: rect.w - inset * 2, h: rect.h - inset * 2 };
    }
    return {
      x: rect.x + (inset.left || 0),
      y: rect.y + (inset.top || 0),
      w: rect.w - (inset.left || 0) - (inset.right || 0),
      h: rect.h - (inset.top || 0) - (inset.bottom || 0)
    };
  }

  function buildRoundRectPath(ctx, x, y, w, h, radius = 0) {
    const safeRadius = clamp(radius, 0, Math.min(w, h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + w, y, x + w, y + h, safeRadius);
    ctx.arcTo(x + w, y + h, x, y + h, safeRadius);
    ctx.arcTo(x, y + h, x, y, safeRadius);
    ctx.arcTo(x, y, x + w, y, safeRadius);
    ctx.closePath();
  }

  function drawRoundedRect(ctx, x, y, w, h, radius = 0, fill = null, stroke = null, lineWidth = 1) {
    if (w <= 0 || h <= 0) return;
    buildRoundRectPath(ctx, x, y, w, h, radius);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function splitWords(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .split("\n")
      .map((paragraph) => paragraph.split(/\s+/).filter(Boolean));
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
    const paragraphs = splitWords(text);
    const font = options.font || ctx.font;
    const align = options.align || "left";
    const color = options.color || ctx.fillStyle;
    const maxLines = options.maxLines || Infinity;
    const paragraphGap = options.paragraphGap ?? Math.round(lineHeight * 0.45);
    const lines = [];

    ctx.save();
    ctx.font = font;

    for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
      const words = paragraphs[paragraphIndex];
      if (!words.length) {
        lines.push("");
        continue;
      }

      let currentLine = words[0];
      for (let index = 1; index < words.length; index += 1) {
        const candidate = `${currentLine} ${words[index]}`;
        if (ctx.measureText(candidate).width <= maxWidth) currentLine = candidate;
        else {
          lines.push(currentLine);
          currentLine = words[index];
        }
      }
      lines.push(currentLine);
      if (paragraphIndex < paragraphs.length - 1) lines.push(null);
    }

    let visibleLines = [];
    for (const line of lines) {
      if (visibleLines.length >= maxLines) break;
      visibleLines.push(line);
    }
    if (lines.length > maxLines && visibleLines.length) {
      const lastIndex = visibleLines.length - 1;
      const lastLine = visibleLines[lastIndex] || "";
      let trimmed = lastLine.replace(/[.?!,:;]+$/, "");
      while (trimmed && ctx.measureText(`${trimmed}…`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1).trimEnd();
      }
      visibleLines[lastIndex] = `${trimmed || lastLine}…`;
    }

    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "top";

    let cursorY = y;
    for (const line of visibleLines) {
      if (line === null) {
        cursorY += paragraphGap;
        continue;
      }
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }

    ctx.restore();
    return {
      lineCount: visibleLines.filter((line) => line !== null).length,
      height: cursorY - y
    };
  }

  function createCanvasController({
    canvas,
    onResize,
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onWheel
  }) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Smore to Explore needs a 2D canvas context.");

    const state = {
      width: 0,
      height: 0,
      pixelRatio: 1,
      isFullscreen: false,
      fullscreenSupported: !!document.fullscreenEnabled
    };

    function updateSize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 3);

      if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = true;

      state.width = width;
      state.height = height;
      state.pixelRatio = pixelRatio;
      state.isFullscreen = !!document.fullscreenElement;

      if (onResize) onResize({ ...state });
    }

    function toCanvasPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function handlePointerMove(event) {
      if (onPointerMove) onPointerMove(toCanvasPoint(event), event);
    }

    function handlePointerDown(event) {
      if (event.pointerType !== "mouse") canvas.setPointerCapture?.(event.pointerId);
      if (onPointerDown) onPointerDown(toCanvasPoint(event), event);
    }

    function handlePointerUp(event) {
      if (onPointerUp) onPointerUp(toCanvasPoint(event), event);
    }

    function handlePointerLeave(event) {
      if (onPointerLeave) onPointerLeave(toCanvasPoint(event), event);
    }

    function handleWheel(event) {
      if (onWheel && onWheel(toCanvasPoint(event), event)) {
        event.preventDefault();
      }
    }

    async function toggleFullscreen(target = canvas) {
      if (!document.fullscreenEnabled) return false;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return true;
      }
      await target.requestFullscreen();
      return true;
    }

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointercancel", handlePointerLeave);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);
    document.addEventListener("fullscreenchange", updateSize);

    updateSize();

    return {
      canvas,
      context,
      state,
      resize: updateSize,
      toCanvasPoint,
      toggleFullscreen,
      destroy() {
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointerleave", handlePointerLeave);
        canvas.removeEventListener("pointercancel", handlePointerLeave);
        canvas.removeEventListener("wheel", handleWheel);
        window.removeEventListener("resize", updateSize);
        window.removeEventListener("orientationchange", updateSize);
        document.removeEventListener("fullscreenchange", updateSize);
      }
    };
  }

  window.SmoreCore = {
    clamp,
    sum,
    unique,
    shuffle,
    pickWeighted,
    rotateEdges,
    formatMoney,
    pointInRect,
    insetRect,
    drawRoundedRect,
    drawWrappedText,
    createCanvasController
  };
})();
