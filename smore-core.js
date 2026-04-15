(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sum(list, iteratee) {
    return list.reduce((total, item, index) => total + iteratee(item, index), 0);
  }

  function count(list, predicate) {
    return list.reduce((total, item, index) => total + (predicate(item, index) ? 1 : 0), 0);
  }

  function unique(list) {
    return [...new Set(list)];
  }

  function shuffle(list) {
    const copy = [...list];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const next = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = next;
    }
    return copy;
  }

  function pickWeighted(items, weightAccessor) {
    const totalWeight = sum(items, (item) => Math.max(0, weightAccessor(item)));
    if (!totalWeight) {
      return items[0];
    }

    let roll = Math.random() * totalWeight;
    for (const item of items) {
      roll -= Math.max(0, weightAccessor(item));
      if (roll <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  function rotateEdges(edges, turns) {
    const normalizedTurns = ((turns % 4) + 4) % 4;
    if (normalizedTurns === 0) {
      return { ...edges };
    }

    let current = { ...edges };
    for (let step = 0; step < normalizedTurns; step += 1) {
      current = {
        north: current.west,
        east: current.north,
        south: current.east,
        west: current.south
      };
    }

    return current;
  }

  function formatMoney(value) {
    return `$${Number(value || 0).toLocaleString("en-US")}`;
  }

  function createCanvasController(options) {
    const { canvas, width, height, onPointerMove, onPointerDown, onPointerLeave } = options;
    const context = canvas.getContext("2d");
    const state = {
      width,
      height
    };

    function resize() {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function toCanvasPoint(event) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return { x: 0, y: 0 };
      }

      return {
        x: ((event.clientX - rect.left) / rect.width) * width,
        y: ((event.clientY - rect.top) / rect.height) * height
      };
    }

    resize();
    window.addEventListener("resize", resize);

    canvas.addEventListener("pointermove", (event) => {
      if (typeof onPointerMove === "function") {
        onPointerMove(toCanvasPoint(event), event);
      }
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (typeof onPointerDown === "function") {
        onPointerDown(toCanvasPoint(event), event);
      }
    });

    canvas.addEventListener("pointerleave", (event) => {
      if (typeof onPointerLeave === "function") {
        onPointerLeave(event);
      }
    });

    return {
      canvas,
      context,
      state,
      resize,
      toCanvasPoint
    };
  }

  function setupFullscreen(options) {
    const {
      button,
      target = document.documentElement,
      onChange
    } = options;

    let pseudoFullscreen = false;

    function isActive() {
      return Boolean(document.fullscreenElement) || pseudoFullscreen;
    }

    function sync() {
      document.body.classList.toggle("fullscreen-mode", isActive());
      if (button) {
        button.textContent = isActive() ? "Exit Fullscreen" : "Fullscreen";
      }
      if (typeof onChange === "function") {
        onChange(isActive());
      }
    }

    async function toggle() {
      if (!document.fullscreenElement && !pseudoFullscreen) {
        if (target.requestFullscreen) {
          try {
            await target.requestFullscreen();
            sync();
            return;
          } catch (error) {
            pseudoFullscreen = true;
            sync();
            return;
          }
        }

        pseudoFullscreen = true;
        sync();
        return;
      }

      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        sync();
        return;
      }

      pseudoFullscreen = false;
      sync();
    }

    if (button) {
      button.addEventListener("click", toggle);
    }

    document.addEventListener("fullscreenchange", () => {
      pseudoFullscreen = false;
      sync();
    });

    sync();

    return {
      toggle,
      isActive
    };
  }

  function drawRoundedRect(context, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();

    if (fillStyle) {
      context.fillStyle = fillStyle;
      context.fill();
    }

    if (strokeStyle) {
      context.strokeStyle = strokeStyle;
      context.lineWidth = lineWidth || 1;
      context.stroke();
    }
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight, options) {
    const settings = options || {};
    const words = String(text || "").split(/\s+/).filter(Boolean);
    let line = "";
    let currentY = y;

    if (settings.font) {
      context.font = settings.font;
    }
    context.fillStyle = settings.color || "#2f261f";
    context.textAlign = settings.align || "left";
    context.textBaseline = settings.baseline || "top";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const measurement = context.measureText(candidate);
      if (measurement.width > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = candidate;
      }
    }

    if (line) {
      context.fillText(line, x, currentY);
    }

    return currentY + lineHeight;
  }

  window.SmoreCore = {
    clamp,
    count,
    createCanvasController,
    drawRoundedRect,
    drawWrappedText,
    formatMoney,
    pickWeighted,
    rotateEdges,
    setupFullscreen,
    shuffle,
    sum,
    unique
  };
})();
