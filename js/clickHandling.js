import {
    canvas
} from "./scene.js"

const pickPosition = {
    x: 0,
    y: 0
};

function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function handleClick(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / canvas.clientWidth) * 2 - 1;
    pickPosition.y = (pos.y / canvas.clientHeight) * -2 + 1; // note we flip Y
}

export {
    pickPosition,
    handleClick
}