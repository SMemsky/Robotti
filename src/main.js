function main() {
    const canvas = document.getElementById("myCanvas");
    const context = canvas.getContext("2d");

    const fieldSizeX = 16;
    const fieldSizeY = 16;

    canvas.width = fieldSizeX * 20;
    canvas.height = fieldSizeY * 20;

    let started = false;
    let field = [];
    for (let i = 0; i < fieldSizeX*fieldSizeY; ++i) {
        field[i] = 0;
    }
    field[0] = 1; field[1] = 1; field[2] = 2;

    let editField = field.slice(0);

    let robotX = 14;
    let robotY = 0;
    let robotRot = 0; // right, down, left, up

    let failed = false;

    let frameSum = 0;
    let lastFrame = 0;

    let stepCount = 0;

    canvas.addEventListener("click", function(event){
        if (started || failed) {
            return;
        }
        const x = Math.floor(event.offsetX / 20);
        const y = Math.floor(event.offsetY / 20);
        if (x < 0 || y < 0 || x >= fieldSizeX || y >= fieldSizeY) {
            return;
        }
        if (event.shiftKey) {
            editField[x + y * fieldSizeX] = 0;
        } else {
            editField[x + y * fieldSizeX] += 1;
            editField[x + y * fieldSizeX] %= 4;
            if (editField[x + y * fieldSizeX] == 0) {
                editField[x + y * fieldSizeX] = 1;
            }
        }
        reset();
    });

    const startButton = document.getElementById("startstop");
    startButton.addEventListener("click", function() {
        if (!started) {
            started = true;
            startButton.innerHTML = "Stop";
            lastFrame = null;
            window.requestAnimationFrame(animate);
        } else {
            started = false;
            startButton.innerHTML = "Start";
        }
    });
    const stepButton = document.getElementById("step");
    stepButton.addEventListener("click", function() {
        if (!started) {
            simulate();
        }
    });
    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", function() {
        reset();
    });

    const robotAngles = [0, 90, 180, 270];

    let arrowImage = new Image();
    arrowImage.src = "res/arrow_20x20.png";
    arrowImage.onload = render;

    function render() {
        const renderStart = Date.now();
        for (let y = 0; y < fieldSizeY; ++y) {
            for (let x = 0; x < fieldSizeX; ++x) {
                if (field[x + fieldSizeX * y] == 0) {
                    context.fillStyle = "#FFF";
                } else if (field[x + fieldSizeX * y] == 1) {
                    context.fillStyle = "#F00";
                } else if (field[x + fieldSizeX * y] == 2) {
                    context.fillStyle = "#0F0";
                } else if (field[x + fieldSizeX * y] == 3) {
                    context.fillStyle = "#00F";
                }

                context.fillRect(x * 20, y * 20, 20, 20);
            }
        }

        context.strokeStyle = "#BFBFBF";
        for (let i = 0; i <= fieldSizeX; ++i) {
            context.moveTo(20 * i, 0);
            context.lineTo(20 * i, 20 * fieldSizeY);
        }
        for (let i = 0; i <= fieldSizeY; ++i) {
            context.moveTo(0, 20 * i);
            context.lineTo(20 * fieldSizeX, 20 * i);
        }
        context.stroke();

        renderRobot();
    };

    function renderSingleCell(x, y) {
        if (field[x + fieldSizeX * y] == 0) {
            context.fillStyle = "#FFF";
        } else if (field[x + fieldSizeX * y] == 1) {
            context.fillStyle = "#F00";
        } else if (field[x + fieldSizeX * y] == 2) {
            context.fillStyle = "#0F0";
        } else if (field[x + fieldSizeX * y] == 3) {
            context.fillStyle = "#00F";
        }

        context.fillRect(x * 20, y * 20, 20, 20);

        context.strokeStyle = "#BFBFBF";
        // Vertical
        context.moveTo(20 * x +  0, 20 * y +  0);
        context.lineTo(20 * x +  0, 20 * y + 20);
        context.moveTo(20 * x + 20, 20 * y +  0);
        context.lineTo(20 * x + 20, 20 * y + 20);
        // Horizontal
        context.moveTo(20 * x +  0, 20 * y +  0);
        context.lineTo(20 * x + 20, 20 * y +  0);
        context.moveTo(20 * x +  0, 20 * y + 20);
        context.lineTo(20 * x + 20, 20 * y + 20);
        context.stroke();
    }

    function renderRobot() {
        context.save();
        context.translate(robotX*20+10, robotY*20+10);
        context.rotate(robotAngles[robotRot]*Math.PI/180);
        context.drawImage(arrowImage, -10, -10, 20, 20);
        context.restore();
    };

    function animate(a) {
        if (lastFrame == null) {
            lastFrame = a;
        }
        const delta = (a - lastFrame) / 1000;
        lastFrame = a;
        let tps = document.getElementById("tps").value;
        if (tps > 500) {
            document.getElementById("tps").value = 500;
            tps = 500;
        }

        const prevX = robotX;
        const prevY = robotY;

        // console.log(delta);
        frameSum += delta;
        while (frameSum > 1/tps) {
            frameSum -= 1/tps;
            if (tps > 50) {
                simulate(true);
            } else {
                simulate();
            }
        }

        if (tps > 50) {
            render();
            document.getElementById("steps").innerHTML = "Step count: " + stepCount;
        }

        if (started && !failed) {
            window.requestAnimationFrame(animate);
        }
    };

    function simulate(norender) {
        if (failed) {
            return;
        }

        if (field[robotX + fieldSizeX * robotY] == 0) {
            fail("Robot can only move on colored cells");
            return;
        }

        prevX = robotX;
        prevY = robotY;
        if (robotRot == 0) { robotX += 1; }
        if (robotRot == 1) { robotY += 1; }
        if (robotRot == 2) { robotX -= 1; }
        if (robotRot == 3) { robotY -= 1; }
        if (robotX == fieldSizeX || robotY == fieldSizeY || robotX < 0 || robotY < 0) {
            robotX = prevX;
            robotY = prevY;
            fail("Robot moved out of bounds");
            return;
        }
        if (field[robotX + fieldSizeX * robotY] == 0) {
            robotX = prevX;
            robotY = prevY;
            fail("Robot can only move on colored cells");
            return;
        }

        if (field[robotX + fieldSizeX * robotY] != field[prevX + fieldSizeX * prevY]) {
            robotRot = (robotRot + 1) % 4;
        }

        field[prevX + fieldSizeX * prevY] = (field[prevX + fieldSizeX * prevY] + 1) % 4;
        if (field[prevX + fieldSizeX * prevY] == 0) {
            field[prevX + fieldSizeX * prevY] = 1;
        }

        stepCount += 1;

        if (norender == null) {
            renderSingleCell(prevX, prevY);
            renderSingleCell(robotX, robotY);
            renderRobot();
            document.getElementById("steps").innerHTML = "Step count: " + stepCount;
        }
    };

    function fail(reason) {
        failed = true;
        console.log("Failed for reason: " + reason);
    }

    function reset() {
        robotX = 0;
        robotY = 0;
        robotRot = 0;
        failed = false;
        moves = 0;
        field = editField.slice(0);
        frameSum = 0;
        stepCount = 0;
        render();
    }
}
