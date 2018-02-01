const fs = require('fs');
const { Image, Canvas, createCanvas } = require('canvas');

function $extend(from, fields) {
    function Inherit() {}
    Inherit.prototype = from;
    const proto = new Inherit();
    for (const name in fields) proto[name] = fields[name];
    if (fields.toString !== Object.prototype.toString)
    proto.toString = fields.toString;
    return proto;
}

fs.readFile(process.argv[2], (err, data) => {
    if (err) throw err;
    const img = new Image(); // Create a new Image
    img.src = data;
    const imageData = canvasToBitmap(imageToCanvas(img));
    const averageImageColor = geometrize_Util.getAverageImageColor(imageData);
    const imageRunner = new ImageRunner(
        imageData,
        averageImageColor
    );
    const options = {
        alpha: 128,
        candidateShapesPerStep: 50,
        shapeMutationsPerStep: 100,
        shapeTypes: [4]
    };
    let steps = process.argv[3] | 30;
    const results = [];
    while (steps--) {
        results.push(imageRunner.step(options)[0]);
    }
    const output = `<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny" width="${
        imageData.width
    }" height="${imageData.height}">
    <rect x="0" y="0" width="${imageData.width}" height="${
        imageData.height
    }" ${SvgExporter.fillForColor(
        averageImageColor
    )}></rect>
    ${SvgExporter.exportShapes(results)}
    </svg>`;
    fs.writeFile('output.svg', output, err => {
        if (err) {
            return console.log(err);
        }
    });
});

const canvasToBitmap = canvas => {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    .data;
    const data = new Array(canvas.width * canvas.height);
    const totalValues = canvas.width * canvas.height * 4;
    for (let i = 0; i < totalValues; i += 4) {
        const red = imageData[i];
        const green = imageData[i + 1];
        const blue = imageData[i + 2];
        const alpha = imageData[i + 3];
        data[i / 4] =
        ((red < 0 ? 0 : red > 255 ? 255 : red) << 24) +
        ((green < 0 ? 0 : green > 255 ? 255 : green) << 16) +
        ((blue < 0 ? 0 : blue > 255 ? 255 : blue) << 8) +
        (alpha < 0 ? 0 : alpha > 255 ? 255 : alpha);
    }
    return {
        width: canvas.width,
        height: canvas.height,
        data
    };
};

const imageToCanvas = image => {
    const newWidth = parseInt(image.width / 4);
    const newHeight = parseInt(image.height / 4);
    const canvas = createCanvas(newWidth, newHeight);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, newWidth, newHeight);
    return canvas;
};

class GeometrizeWorker {
    messageHandler(event) {
        if (event == null || event.data == null) {
            return;
        }
        const message = event.data;
        switch (message.id) {
            case 'should_set_target_image':
            const target = message.data;
            this.runner = new ImageRunner(
                target,
                geometrize_Util.getAverageImageColor(target)
            );
            this.postMessage({
                id: 'did_set_target_image',
                data: null
            });
            break;
            case 'should_step':
            const options = message.data;
            const results = this.runner.step(options);
            const svgData = SvgExporter.exportShapes(results);
            this.postMessage({
                id: 'did_step',
                data: svgData
            });
            break;
        }
    }

    postMessage(message) {}
}

class Std {
    static random(x) {
        if (x <= 0) {
            return 0;
        } else {
            return Math.floor(Math.random() * x);
        }
    }

    static iter(a) {
        return {
            cur: 0,
            arr: a,
            hasNext() {
                return this.cur < this.arr.length;
            },
            next() {
                return this.arr[this.cur++];
            }
        };
    }
}



const ArraySet = {};
ArraySet.create = array => {
    if (array == null) {
        const this1 = [];
        return this1;
    }
    return ArraySet.toSet(array);
};
ArraySet.add = (this1, element) => {
    if (!(element != null)) {
        throw new Error('FAIL: element != null');
    }
    if (ArraySet.contains(this1, element)) {
        return false;
    }
    this1.push(element);
    return true;
};
ArraySet.contains = (this1, element) => {
    let _g = 0;
    while (_g < this1.length) {
        const i = this1[_g];
        ++_g;
        if (i == element) {
            return true;
        }
    }
    return false;
};
ArraySet.toArray = this1 => this1.slice();
ArraySet.toSet = array => {
    const this1 = [];
    const set = this1;
    let _g = 0;
    while (_g < array.length) {
        const v = array[_g];
        ++_g;
        ArraySet.add(set, v);
    }
    return set;
};

class geometrize_Core {
    static computeColor(target, current, lines, alpha) {
        if (target === null) {
            throw new Error('FAIL: target != null');
        }
        if (!(current != null)) {
            throw new Error('FAIL: current != null');
        }
        if (!(lines != null)) {
            throw new Error('FAIL: lines != null');
        }
        if (!(alpha >= 0)) {
            throw new Error('FAIL: alpha >= 0');
        }
        let totalRed = 0;
        let totalGreen = 0;
        let totalBlue = 0;
        let count = 0;
        const f = 65535 / alpha;
        const a = f | 0;
        let _g = 0;
        while (_g < lines.length) {
            const line = lines[_g];
            ++_g;
            const y = line.y;
            let _g2 = line.x1;
            const _g1 = line.x2 + 1;
            while (_g2 < _g1) {
                const x = _g2++;
                const t = target.data[target.width * y + x];
                const c = current.data[current.width * y + x];
                totalRed +=
                (((t >> 24) & 255) - ((c >> 24) & 255)) * a + ((c >> 24) & 255) * 257;
                totalGreen +=
                (((t >> 16) & 255) - ((c >> 16) & 255)) * a + ((c >> 16) & 255) * 257;
                totalBlue +=
                (((t >> 8) & 255) - ((c >> 8) & 255)) * a + ((c >> 8) & 255) * 257;
                ++count;
            }
        }
        if (count == 0) {
            return 0;
        }
        const value = ((totalRed / count) | 0) >> 8;
        const r = value < 0 ? 0 : value > 255 ? 255 : value;
        const value1 = ((totalGreen / count) | 0) >> 8;
        const g = value1 < 0 ? 0 : value1 > 255 ? 255 : value1;
        const value2 = ((totalBlue / count) | 0) >> 8;
        const b = value2 < 0 ? 0 : value2 > 255 ? 255 : value2;
        return (
            ((r < 0 ? 0 : r > 255 ? 255 : r) << 24) +
            ((g < 0 ? 0 : g > 255 ? 255 : g) << 16) +
            ((b < 0 ? 0 : b > 255 ? 255 : b) << 8) +
            (alpha < 0 ? 0 : alpha > 255 ? 255 : alpha)
        );
    }

    static differenceFull(first, second) {
        if (first === null) {
            throw new Error('FAIL: first != null');
        }
        if (second === null) {
            throw new Error('FAIL: second != null');
        }
        const actual = first.width;
        const expected = second.width;
        if (actual != expected) {
            throw new Error(
                `FAIL: values are not equal (expected: ${expected}, actual: ${actual})`
            );
        }
        const actual1 = first.height;
        const expected1 = second.height;
        if (actual1 != expected1) {
            throw new Error(
                `FAIL: values are not equal (expected: ${expected1}, actual: ${
                    actual1
                })`
            );
        }
        let total = 0;
        const width = first.width;
        const height = first.height;
        let _g1 = 0;
        const _g = height;
        while (_g1 < _g) {
            const y = _g1++;
            let _g3 = 0;
            const _g2 = width;
            while (_g3 < _g2) {
                const x = _g3++;
                const f = first.data[first.width * y + x];
                const s = second.data[second.width * y + x];
                const dr = ((f >> 24) & 255) - ((s >> 24) & 255);
                const dg = ((f >> 16) & 255) - ((s >> 16) & 255);
                const db = ((f >> 8) & 255) - ((s >> 8) & 255);
                const da = (f & 255) - (s & 255);
                total += dr * dr + dg * dg + db * db + da * da;
            }
        }
        return Math.sqrt(total / (width * height * 4.0)) / 255;
    }

    static differencePartial(target, before, after, score, lines) {
        if (target === null) {
            throw new Error('FAIL: target != null');
        }
        if (before === null) {
            throw new Error('FAIL: before != null');
        }
        if (after === null) {
            throw new Error('FAIL: after != null');
        }
        if (lines === null) {
            throw new Error('FAIL: lines != null');
        }
        const width = target.width;
        const height = target.height;
        const rgbaCount = width * height * 4;
        let total = score * 255 ** 2 * rgbaCount;
        let _g = 0;
        while (_g < lines.length) {
            const line = lines[_g];
            ++_g;
            const y = line.y;
            let _g2 = line.x1;
            const _g1 = line.x2 + 1;
            while (_g2 < _g1) {
                const x = _g2++;
                const t = target.data[target.width * y + x];
                const b = before.data[before.width * y + x];
                const a = after.data[after.width * y + x];
                const dtbr = ((t >> 24) & 255) - ((b >> 24) & 255);
                const dtbg = ((t >> 16) & 255) - ((b >> 16) & 255);
                const dtbb = ((t >> 8) & 255) - ((b >> 8) & 255);
                const dtba = (t & 255) - (b & 255);
                const dtar = ((t >> 24) & 255) - ((a >> 24) & 255);
                const dtag = ((t >> 16) & 255) - ((a >> 16) & 255);
                const dtab = ((t >> 8) & 255) - ((a >> 8) & 255);
                const dtaa = (t & 255) - (a & 255);
                total -= dtbr * dtbr + dtbg * dtbg + dtbb * dtbb + dtba * dtba;
                total += dtar * dtar + dtag * dtag + dtab * dtab + dtaa * dtaa;
            }
        }
        return Math.sqrt(total / rgbaCount) / 255;
    }

    static bestRandomState(shapes, alpha, n, target, current, buffer, lastScore) {
        let bestEnergy = 0;
        let bestState = null;
        let _g1 = 0;
        const _g = n;
        while (_g1 < _g) {
            const i = _g1++;
            const state = new geometrize_State(
                ShapeFactory.randomShapeOf(
                    shapes,
                    current.width,
                    current.height
                ),
                alpha,
                target,
                current,
                buffer
            );
            const energy = state.energy(lastScore);
            if (i == 0 || energy < bestEnergy) {
                bestEnergy = energy;
                bestState = state;
            }
        }
        return bestState;
    }

    static bestHillClimbState(
        shapes,
        alpha,
        n,
        age,
        target,
        current,
        buffer,
        lastScore
    ) {
        let state = geometrize_Core.bestRandomState(
            shapes,
            alpha,
            n,
            target,
            current,
            buffer,
            lastScore
        );
        state = geometrize_Core.hillClimb(state, age, lastScore);
        return state;
    }

    static hillClimb(state, maxAge, lastScore) {
        if (!(state != null)) {
            throw new Error('FAIL: state != null');
        }
        if (!(maxAge >= 0)) {
            throw new Error('FAIL: maxAge >= 0');
        }
        let state1 = state.clone();
        let bestState = state1.clone();
        let bestEnergy = state1.energy(lastScore);
        let age = 0;
        while (age < maxAge) {
            const undo = state1.mutate();
            const energy = state1.energy(lastScore);
            if (energy >= bestEnergy) {
                state1 = undo;
            } else {
                bestEnergy = energy;
                bestState = state1.clone();
                age = -1;
            }
            ++age;
        }
        return bestState;
    }

    static energy(shape, alpha, target, current, buffer, score) {
        if (shape === null) {
            throw new Error('FAIL: shape != null');
        }
        if (target === null) {
            throw new Error('FAIL: target != null');
        }
        if (current === null) {
            throw new Error('FAIL: current != null');
        }
        if (buffer === null) {
            throw new Error('FAIL: buffer != null');
        }
        const lines = shape.rasterize();
        const color = geometrize_Core.computeColor(target, current, lines, alpha);
        Rasterizer.copyLines(buffer, current, lines);
        Rasterizer.drawLines(buffer, color, lines);
        return geometrize_Core.differencePartial(
            target,
            current,
            buffer,
            score,
            lines
        );
    }
}

class geometrize_Model {
    constructor(target, backgroundColor) {
        if (target === null) {
            throw new Error('FAIL: target != null');
        }
        this.width = target.width;
        this.height = target.height;
        this.target = target;
        const w = target.width;
        const h = target.height;
        const bitmap = new geometrize_bitmap_Bitmap();
        bitmap.width = w;
        bitmap.height = h;
        const this1 = new Array(w * h);
        bitmap.data = this1;
        let i = 0;
        while (i < bitmap.data.length) {
            bitmap.data[i] = backgroundColor;
            ++i;
        }
        this.current = bitmap;
        const w1 = target.width;
        const h1 = target.height;
        const bitmap1 = new geometrize_bitmap_Bitmap();
        bitmap1.width = w1;
        bitmap1.height = h1;
        const this2 = new Array(w1 * h1);
        bitmap1.data = this2;
        let i1 = 0;
        while (i1 < bitmap1.data.length) {
            bitmap1.data[i1] = backgroundColor;
            ++i1;
        }
        this.buffer = bitmap1;
        this.score = geometrize_Core.differenceFull(target, this.current);
    }

    step(shapeTypes, alpha, n, age) {
        const state = geometrize_Core.bestHillClimbState(
            shapeTypes,
            alpha,
            n,
            age,
            this.target,
            this.current,
            this.buffer,
            this.score
        );
        return [this.addShape(state.shape, state.alpha)];
    }

    addShape(shape, alpha) {
        if (shape === null) {
            throw new Error('FAIL: shape != null');
        }
        const _this = this.current;
        const bitmap = new geometrize_bitmap_Bitmap();
        bitmap.width = _this.width;
        bitmap.height = _this.height;
        const length = _this.data.length;
        const this1 = new Array(length);
        bitmap.data = this1;
        let _g1 = 0;
        const _g = _this.data.length;
        while (_g1 < _g) {
            const i = _g1++;
            bitmap.data[i] = _this.data[i];
        }
        const before = bitmap;
        const lines = shape.rasterize();
        const color = geometrize_Core.computeColor(
            this.target,
            this.current,
            lines,
            alpha
        );
        Rasterizer.drawLines(this.current, color, lines);
        this.score = geometrize_Core.differencePartial(
            this.target,
            before,
            this.current,
            this.score,
            lines
        );
        return {
            score: this.score,
            color,
            shape
        };
    }
}

class geometrize_State {
    constructor(shape, alpha, target, current, buffer) {
        if (shape === null) {
            throw new Error('FAIL: shape != null');
        }
        this.shape = shape;
        this.alpha = alpha;
        this.score = -1;
        this.target = target;
        this.current = current;
        this.buffer = buffer;
    }

    energy(lastScore) {
        if (this.score < 0) {
            this.score = geometrize_Core.energy(
                this.shape,
                this.alpha,
                this.target,
                this.current,
                this.buffer,
                lastScore
            );
        }
        return this.score;
    }

    mutate() {
        const oldState = this.clone();
        this.shape.mutate();
        return oldState;
    }

    clone() {
        return new geometrize_State(
            this.shape.clone(),
            this.alpha,
            this.target,
            this.current,
            this.buffer
        );
    }
}

class geometrize_Util {
    static getAverageImageColor(image) {
        if (image === null) {
            throw new Error('FAIL: image != null');
        }
        let totalRed = 0;
        let totalGreen = 0;
        let totalBlue = 0;
        let _g1 = 0;
        const _g = image.width;
        while (_g1 < _g) {
            const x = _g1++;
            let _g3 = 0;
            const _g2 = image.height;
            while (_g3 < _g2) {
                const y = _g3++;
                const pixel = image.data[image.width * y + x];
                totalRed += (pixel >> 24) & 255;
                totalGreen += (pixel >> 16) & 255;
                totalBlue += (pixel >> 8) & 255;
                /*totalRed += image.data[4 * (image.width * y + x)];
                totalGreen += image.data[4 * (image.width * y + x) + 1];
                totalBlue += image.data[4 * (image.width * y + x) + 2];*/
            }
        }
        const size = image.width * image.height;
        const red = (totalRed / size) | 0;
        const green = (totalGreen / size) | 0;
        const blue = (totalBlue / size) | 0;
        return (
            ((red < 0 ? 0 : red > 255 ? 255 : red) << 24) +
            ((green < 0 ? 0 : green > 255 ? 255 : green) << 16) +
            ((blue < 0 ? 0 : blue > 255 ? 255 : blue) << 8) +
            255
        );
    }
}

class geometrize_bitmap_Bitmap {
    constructor() {}
}

class SvgExporter {
    static exportShapes(shapes) {
        let results = '';
        let _g1 = 0;
        const _g = shapes.length;
        while (_g1 < _g) {
            const i = _g1++;
            results += SvgExporter.exportShape(shapes[i]);
            if (i != shapes.length - 1) {
                results += '\n';
            }
        }
        return results;
    }

    static exportShape(shape) {
        return shape.shape.getSvgShapeData().replace(
            SvgExporter.SVG_STYLE_HOOK,
            SvgExporter.stylesForShape(shape)
        );
    }

    static stylesForShape(shape) {
        if (shape.shape instanceof LineShape) {
            return `${SvgExporter.strokeForColor(
                shape.color
            )} stroke-width="1" fill="none" ${SvgExporter.strokeOpacityForAlpha(
                shape.color & 255
            )}`;
        } else {
            return `${SvgExporter.fillForColor(
                shape.color
            )} ${SvgExporter.fillOpacityForAlpha(
                shape.color & 255
            )}`;
        }
    }

    static rgbForColor(color) {
        return '#' +
            ((color >> 24) & 255).toString(16).padStart(2, '0').substr(0,1) +
            ((color >> 16) & 255).toString(16).padStart(2, '0').substr(0,1) +
            ((color >> 8) & 255).toString(16).padStart(2, '0').substr(0,1);
    }

    static strokeForColor(color) {
        return `stroke="${SvgExporter.rgbForColor(color)}"`;
    }

    static fillForColor(color) {
        return `fill="${SvgExporter.rgbForColor(color)}"`;
    }

    static fillOpacityForAlpha(alpha) {
        // let opacity = alpha / 255.0;
        if (alpha >= 250) {
            return '';
        }

        return `fill-opacity="${(alpha / 255.0).toPrecision(2)}"`;
    }

    static strokeOpacityForAlpha(alpha) {
        return `stroke-opacity="${(alpha / 255.0).toPrecision(2)}"`;
    }
}

class Rasterizer {
    static drawLines(image, c, lines) {
        if (image === null) {
            throw new Error('FAIL: image != null');
        }
        if (!(lines != null)) {
            throw new Error('FAIL: lines != null');
        }
        let sr = (c >> 24) & 255;
        sr |= sr << 8;
        sr *= c & 255;
        sr = (sr / 255) | 0;
        let sg = (c >> 16) & 255;
        sg |= sg << 8;
        sg *= c & 255;
        sg = (sg / 255) | 0;
        let sb = (c >> 8) & 255;
        sb |= sb << 8;
        sb *= c & 255;
        sb = (sb / 255) | 0;
        let sa = c & 255;
        sa |= sa << 8;
        let _g = 0;
        while (_g < lines.length) {
            const line = lines[_g];
            ++_g;
            const y = line.y;
            const ma = 65535;
            const m = 65535;
            const $as = (m - sa * (ma / m)) * 257;
            const a = $as | 0;
            let _g2 = line.x1;
            const _g1 = line.x2 + 1;
            while (_g2 < _g1) {
                const x = _g2++;
                const d = image.data[image.width * y + x];
                const dr = (d >> 24) & 255;
                const dg = (d >> 16) & 255;
                const db = (d >> 8) & 255;
                const da = d & 255;
                const r =
                ((parseFloat(dr * a + sr * ma) / m) |
                0) >>
                8;
                const g =
                ((parseFloat(dg * a + sg * ma) /
                m) |
                0) >>
                8;
                const b =
                ((parseFloat(db * a + sb * ma) /
                m) |
                0) >>
                8;
                const a1 =
                ((parseFloat(da * a + sa * ma) /
                m) |
                0) >>
                8;
                image.data[image.width * y + x] =
                ((r < 0 ? 0 : r > 255 ? 255 : r) << 24) +
                ((g < 0 ? 0 : g > 255 ? 255 : g) << 16) +
                ((b < 0 ? 0 : b > 255 ? 255 : b) << 8) +
                (a1 < 0 ? 0 : a1 > 255 ? 255 : a1);
            }
        }
    }

    static copyLines(destination, source, lines) {
        if (!(destination != null)) {
            throw new Error('FAIL: destination != null');
        }
        if (!(source != null)) {
            throw new Error('FAIL: source != null');
        }
        if (!(lines != null)) {
            throw new Error('FAIL: lines != null');
        }
        let _g = 0;
        while (_g < lines.length) {
            const line = lines[_g];
            ++_g;
            const y = line.y;
            let _g2 = line.x1;
            const _g1 = line.x2 + 1;
            while (_g2 < _g1) {
                const x = _g2++;
                destination.data[destination.width * y + x] =
                source.data[source.width * y + x];
            }
        }
    }

    static bresenham(x1, y1, x2, y2) {
        let dx = x2 - x1;
        const ix = (dx > 0 ? 1 : 0) - (dx < 0 ? 1 : 0);
        dx = (dx < 0 ? -dx : dx) << 1;
        let dy = y2 - y1;
        const iy = (dy > 0 ? 1 : 0) - (dy < 0 ? 1 : 0);
        dy = (dy < 0 ? -dy : dy) << 1;
        const points = [];
        points.push({
            x: x1,
            y: y1
        });
        if (dx >= dy) {
            let error = dy - (dx >> 1);
            while (x1 != x2) {
                if (error >= 0 && (error != 0 || ix > 0)) {
                    error -= dx;
                    y1 += iy;
                }
                error += dy;
                x1 += ix;
                points.push({
                    x: x1,
                    y: y1
                });
            }
        } else {
            let error1 = dx - (dy >> 1);
            while (y1 != y2) {
                if (error1 >= 0 && (error1 != 0 || iy > 0)) {
                    error1 -= dy;
                    x1 += ix;
                }
                error1 += dx;
                y1 += iy;
                points.push({
                    x: x1,
                    y: y1
                });
            }
        }
        return points;
    }

    static scanlinesForPolygon(points) {
        const lines = [];
        let edges = [];
        let _g1 = 0;
        const _g = points.length;
        while (_g1 < _g) {
            const i = _g1++;
            const p1 = points[i];
            const p2 = i == points.length - 1 ? points[0] : points[i + 1];
            const p1p2 = Rasterizer.bresenham(
                p1.x,
                p1.y,
                p2.x,
                p2.y
            );
            edges = edges.concat(p1p2);
        }
        const yToXs = new haxe_ds_IntMap();
        let _g2 = 0;
        while (_g2 < edges.length) {
            const point = edges[_g2];
            ++_g2;
            let s = yToXs.h[point.y];
            if (s != null) {
                ArraySet.add(s, point.x);
            } else {
                s = ArraySet.create();
                ArraySet.add(s, point.x);
                yToXs.h[point.y] = s;
            }
        }
        const key = yToXs.keys();
        while (key.hasNext()) {
            const key1 = key.next();
            const a = ArraySet.toArray(yToXs.h[key1]);
            let minMaxElements;
            if (a == null || a.length == 0) {
                minMaxElements = {
                    x: 0,
                    y: 0
                };
            } else {
                let min = a[0];
                let max = a[0];
                let _g3 = 0;
                while (_g3 < a.length) {
                    const value = a[_g3];
                    ++_g3;
                    if (min > value) {
                        min = value;
                    }
                    if (max < value) {
                        max = value;
                    }
                }
                minMaxElements = {
                    x: min,
                    y: max
                };
            }
            lines.push(
                new Scanline(
                    key1,
                    minMaxElements.x,
                    minMaxElements.y
                )
            );
        }
        return lines;
    }
}

class Scanline {
    constructor(y, x1, x2) {
        this.y = y;
        this.x1 = x1;
        this.x2 = x2;
    }

    static trim(scanlines, w, h) {
        if (!(scanlines != null)) {
            throw new Error('FAIL: scanlines != null');
        }
        const w1 = w;
        const h1 = h;
        return scanlines.filter(a1 =>
            Scanline.trimHelper(a1, w1, h1)
        );
    }

    static trimHelper(line, w, h) {
        if (line.y < 0 || line.y >= h || line.x1 >= w || line.x2 < 0) {
            return false;
        }
        const value = line.x1;
        const max = w - 1;
        if (0 > max) {
            throw new Error('FAIL: min <= max');
        }
        line.x1 = value < 0 ? 0 : value > max ? max : value;
        const value1 = line.x2;
        const max1 = w - 1;
        if (0 > max1) {
            throw new Error('FAIL: min <= max');
        }
        line.x2 = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
        return line.x1 <= line.x2;
    }
}

class ImageRunner {
    constructor(inputImage, backgroundColor) {
        this.model = null;
        this.model = new geometrize_Model(inputImage, backgroundColor);
    }

    step(options) {
        return this.model.step(
            options.shapeTypes,
            options.alpha,
            options.candidateShapesPerStep,
            options.shapeMutationsPerStep
        );
    }
}

const Shape = () => {};

class EllipseShape {
    constructor(xBound, yBound) {
        this.x = Std.random(xBound);
        this.y = Std.random(yBound);
        this.rx = Std.random(32) + 1;
        this.ry = Std.random(32) + 1;
        this.xBound = xBound;
        this.yBound = yBound;
    }

    rasterize() {
        const lines = [];
        const aspect = this.rx / this.ry;
        const w = this.xBound;
        const h = this.yBound;
        let _g1 = 0;
        const _g = this.ry;
        while (_g1 < _g) {
            const dy = _g1++;
            const y1 = this.y - dy;
            const y2 = this.y + dy;
            if ((y1 < 0 || y1 >= h) && (y2 < 0 || y2 >= h)) {
                continue;
            }
            const s = (Math.sqrt(this.ry * this.ry - dy * dy) * aspect) | 0;
            let x1 = this.x - s;
            let x2 = this.x + s;
            if (x1 < 0) {
                x1 = 0;
            }
            if (x2 >= w) {
                x2 = w - 1;
            }
            if (y1 >= 0 && y1 < h) {
                lines.push(new Scanline(y1, x1, x2));
            }
            if (y2 >= 0 && y2 < h && dy > 0) {
                lines.push(new Scanline(y2, x1, x2));
            }
        }
        return lines;
    }

    mutate() {
        const r = Std.random(3);
        switch (r) {
            case 0:
            const value = this.x + (-16 + Std.random(33));
            const max = this.xBound - 1;
            if (0 > max) {
                throw new Error('FAIL: min <= max');
            }
            this.x = value < 0 ? 0 : value > max ? max : value;
            const value1 = this.y + (-16 + Std.random(33));
            const max1 = this.yBound - 1;
            if (0 > max1) {
                throw new Error('FAIL: min <= max');
            }
            this.y = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
            break;
            case 1:
            const value2 = this.rx + (-16 + Std.random(33));
            const max2 = this.xBound - 1;
            if (1 > max2) {
                throw new Error('FAIL: min <= max');
            }
            this.rx = value2 < 1 ? 1 : value2 > max2 ? max2 : value2;
            break;
            case 2:
            const value3 = this.ry + (-16 + Std.random(33));
            const max3 = this.xBound - 1;
            if (1 > max3) {
                throw new Error('FAIL: min <= max');
            }
            this.ry = value3 < 1 ? 1 : value3 > max3 ? max3 : value3;
            break;
        }
    }

    clone() {
        const ellipse = new EllipseShape(this.xBound, this.yBound);
        ellipse.x = this.x;
        ellipse.y = this.y;
        ellipse.rx = this.rx;
        ellipse.ry = this.ry;
        return ellipse;
    }

    getSvgShapeData() {
        let svgString = '<ellipse';
        if (parseInt(this.x) > 0) {
            svgString += ' cx="' + this.x + '"';
        }
        if (parseInt(this.y) > 0) {
            svgString += ' cy="' + this.y + '"';
        }

        svgString += `rx="${this.rx}" ry="${this.ry}" ${SvgExporter.SVG_STYLE_HOOK} />`;


        return svgString;
    }
}

EllipseShape.__interfaces__ = [Shape];
const CircleShape = function(xBound, yBound) {
    EllipseShape.call(this, xBound, yBound);
    this.rx = Std.random(32) + 1;
    this.ry = this.rx;
};
CircleShape.__super__ = EllipseShape;
CircleShape.prototype = $extend(
    EllipseShape.prototype,
    {
        mutate() {
            const r = Std.random(2);
            switch (r) {
                case 0:
                const value = this.x + (-16 + Std.random(33));
                const max = this.xBound - 1;
                if (0 > max) {
                    throw new Error('FAIL: min <= max');
                }
                this.x = value < 0 ? 0 : value > max ? max : value;
                const value1 = this.y + (-16 + Std.random(33));
                const max1 = this.yBound - 1;
                if (0 > max1) {
                    throw new Error('FAIL: min <= max');
                }
                this.y = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
                break;
                case 1:
                const value2 = this.rx + (-16 + Std.random(33));
                const max2 = this.xBound - 1;
                if (1 > max2) {
                    throw new Error('FAIL: min <= max');
                }
                const r1 = value2 < 1 ? 1 : value2 > max2 ? max2 : value2;
                this.rx = r1;
                this.ry = r1;
                break;
            }
        },
        clone() {
            const circle = new CircleShape(this.xBound, this.yBound);
            circle.x = this.x;
            circle.y = this.y;
            circle.rx = this.rx;
            circle.ry = this.ry;
            return circle;
        },
        getSvgShapeData() {
            return `<circle cx="${this.x}" cy="${this.y}" r="${this.rx}" ${
                SvgExporter.SVG_STYLE_HOOK
            } />`;
        }
    }
);

class LineShape {
    constructor(xBound, yBound) {
        this.x1 = Std.random(xBound);
        this.y1 = Std.random(yBound);
        const value = this.x1 + Std.random(32) + 1;
        if (0 > xBound) {
            throw new Error('FAIL: min <= max');
        }
        this.x2 = value < 0 ? 0 : value > xBound ? xBound : value;
        const value1 = this.y1 + Std.random(32) + 1;
        if (0 > yBound) {
            throw new Error('FAIL: min <= max');
        }
        this.y2 = value1 < 0 ? 0 : value1 > yBound ? yBound : value1;
        this.xBound = xBound;
        this.yBound = yBound;
    }

    rasterize() {
        const lines = [];
        const points = Rasterizer.bresenham(
            this.x1,
            this.y1,
            this.x2,
            this.y2
        );
        let _g = 0;
        while (_g < points.length) {
            const point = points[_g];
            ++_g;
            lines.push(new Scanline(point.y, point.x, point.x));
        }
        return Scanline.trim(lines, this.xBound, this.yBound);
    }

    mutate() {
        const r = Std.random(4);
        switch (r) {
            case 0:
            const value = this.x1 + (-16 + Std.random(33));
            const max = this.xBound - 1;
            if (0 > max) {
                throw new Error('FAIL: min <= max');
            }
            this.x1 = value < 0 ? 0 : value > max ? max : value;
            const value1 = this.y1 + (-16 + Std.random(33));
            const max1 = this.yBound - 1;
            if (0 > max1) {
                throw new Error('FAIL: min <= max');
            }
            this.y1 = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
            break;
            case 1:
            const value2 = this.x2 + (-16 + Std.random(33));
            const max2 = this.xBound - 1;
            if (0 > max2) {
                throw new Error('FAIL: min <= max');
            }
            this.x2 = value2 < 0 ? 0 : value2 > max2 ? max2 : value2;
            const value3 = this.y2 + (-16 + Std.random(33));
            const max3 = this.yBound - 1;
            if (0 > max3) {
                throw new Error('FAIL: min <= max');
            }
            this.y2 = value3 < 0 ? 0 : value3 > max3 ? max3 : value3;
            break;
        }
    }

    clone() {
        const line = new LineShape(this.xBound, this.yBound);
        line.x1 = this.x1;
        line.y1 = this.y1;
        line.x2 = this.x2;
        line.y2 = this.y2;
        return line;
    }

    getSvgShapeData() {
        return `<line x1="${this.x1}" y1="${this.y1}" x2="${this.x2}" y2="${
            this.y2
        }" ${SvgExporter.SVG_STYLE_HOOK} />`;
    }
}

LineShape.__interfaces__ = [Shape];

class RectangleShape {
    constructor(xBound, yBound) {
        this.x1 = Std.random(xBound);
        this.y1 = Std.random(yBound);
        const value = this.x1 + Std.random(32) + 1;
        const max = xBound - 1;
        if (0 > max) {
            throw new Error('FAIL: min <= max');
        }
        this.x2 = value < 0 ? 0 : value > max ? max : value;
        const value1 = this.y1 + Std.random(32) + 1;
        const max1 = yBound - 1;
        if (0 > max1) {
            throw new Error('FAIL: min <= max');
        }
        this.y2 = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
        this.xBound = xBound;
        this.yBound = yBound;
    }

    rasterize() {
        const lines = [];
        let _g1 = this.y1;
        const _g = this.y2;
        while (_g1 < _g) {
            const y = _g1++;
            if (this.x1 != this.x2) {
                const first = this.x1;
                const second = this.x2;
                const first1 = this.x1;
                const second1 = this.x2;
                lines.push(
                    new Scanline(
                        y,
                        first < second ? first : second,
                        first1 > second1 ? first1 : second1
                    )
                );
            }
        }
        return lines;
    }

    mutate() {
        const r = Std.random(2);
        switch (r) {
            case 0:
            const value = this.x1 + (-16 + Std.random(33));
            const max = this.xBound - 1;
            if (0 > max) {
                throw new Error('FAIL: min <= max');
            }
            this.x1 = value < 0 ? 0 : value > max ? max : value;
            const value1 = this.y1 + (-16 + Std.random(33));
            const max1 = this.yBound - 1;
            if (0 > max1) {
                throw new Error('FAIL: min <= max');
            }
            this.y1 = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
            break;
            case 1:
            const value2 = this.x2 + (-16 + Std.random(33));
            const max2 = this.xBound - 1;
            if (0 > max2) {
                throw new Error('FAIL: min <= max');
            }
            this.x2 = value2 < 0 ? 0 : value2 > max2 ? max2 : value2;
            const value3 = this.y2 + (-16 + Std.random(33));
            const max3 = this.yBound - 1;
            if (0 > max3) {
                throw new Error('FAIL: min <= max');
            }
            this.y2 = value3 < 0 ? 0 : value3 > max3 ? max3 : value3;
            break;
        }
    }

    clone() {
        const rectangle = new RectangleShape(this.xBound, this.yBound);
        rectangle.x1 = this.x1;
        rectangle.y1 = this.y1;
        rectangle.x2 = this.x2;
        rectangle.y2 = this.y2;
        return rectangle;
    }

    getSvgShapeData() {
        const first = this.x1;
        const second = this.x2;
        const first1 = this.y1;
        const second1 = this.y2;
        const first2 = this.x1;
        const second2 = this.x2;
        const first3 = this.x1;
        const second3 = this.x2;
        const first4 = this.y1;
        const second4 = this.y2;
        const first5 = this.y1;
        const second5 = this.y2;
        return `<rect x="${first < second ? first : second}" y="${
            first1 < second1 ? first1 : second1
        }" width="${(first2 > second2 ? first2 : second2) -
            (first3 < second3 ? first3 : second3)}" height="${(first4 > second4
                ? first4
                : second4) - (first5 < second5 ? first5 : second5)}" ${
                    SvgExporter.SVG_STYLE_HOOK
                } />`;
    }
}

RectangleShape.__interfaces__ = [Shape];

class RotatedEllipseShape {
    constructor(xBound, yBound) {
        this.x = Std.random(xBound);
        this.y = Std.random(yBound);
        this.rx = Std.random(32) + 1;
        this.ry = Std.random(32) + 1;
        this.angle = Std.random(360);
        this.xBound = xBound;
        this.yBound = yBound;
    }

    rasterize() {
        const pointCount = 20;
        const points = [];
        const rads = this.angle * (Math.PI / 180.0);
        const c = Math.cos(rads);
        const s = Math.sin(rads);
        let _g1 = 0;
        const _g = pointCount;
        while (_g1 < _g) {
            const i = _g1++;
            const rot = 360.0 / pointCount * i * (Math.PI / 180.0);
            const crx = this.rx * Math.cos(rot);
            const cry = this.ry * Math.sin(rot);
            const tx = (crx * c - cry * s + this.x) | 0;
            const ty = (crx * s + cry * c + this.y) | 0;
            points.push({
                x: tx,
                y: ty
            });
        }
        return Scanline.trim(
            Rasterizer.scanlinesForPolygon(points),
            this.xBound,
            this.yBound
        );
    }

    mutate() {
        const r = Std.random(4);
        switch (r) {
            case 0:
            const value = this.x + (-16 + Std.random(33));
            const max = this.xBound - 1;
            if (0 > max) {
                throw new Error('FAIL: min <= max');
            }
            this.x = value < 0 ? 0 : value > max ? max : value;
            const value1 = this.y + (-16 + Std.random(33));
            const max1 = this.yBound - 1;
            if (0 > max1) {
                throw new Error('FAIL: min <= max');
            }
            this.y = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
            break;
            case 1:
            const value2 = this.rx + (-16 + Std.random(33));
            const max2 = this.xBound - 1;
            if (1 > max2) {
                throw new Error('FAIL: min <= max');
            }
            this.rx = value2 < 1 ? 1 : value2 > max2 ? max2 : value2;
            break;
            case 2:
            const value3 = this.ry + (-16 + Std.random(33));
            const max3 = this.yBound - 1;
            if (1 > max3) {
                throw new Error('FAIL: min <= max');
            }
            this.ry = value3 < 1 ? 1 : value3 > max3 ? max3 : value3;
            break;
            case 3:
            const value4 = this.angle + (-4 + Std.random(9));
            this.angle = value4 < 0 ? 0 : value4 > 360 ? 360 : value4;
            break;
        }
    }

    clone() {
        const ellipse = new RotatedEllipseShape(
            this.xBound,
            this.yBound
        );
        ellipse.x = this.x;
        ellipse.y = this.y;
        ellipse.rx = this.rx;
        ellipse.ry = this.ry;
        ellipse.angle = this.angle;
        return ellipse;
    }

    getSvgShapeData() {
        let svgString = '<g transform="';
        if (parseInt(this.x) != 0 || parseInt(this.y) != 0) {
            svgString += 'translate(' + this.x + ' ' + this.y + ') ';
        }
        if (parseInt(this.angle) != 0) {
            svgString += 'rotate(' + this.angle + ') ';
        }
        svgString += ` scale(${this.rx} ${this.ry})">`;
        svgString += `<ellipse rx="${1}" ry="${1}" ${
            SvgExporter.SVG_STYLE_HOOK
        } />`;
        svgString += '</g>';

        return svgString;
    }
}

RotatedEllipseShape.__interfaces__ = [Shape];

class RotatedRectangleShape {
    constructor(xBound, yBound) {
        this.x1 = Std.random(xBound);
        this.y1 = Std.random(yBound);
        const value = this.x1 + Std.random(32) + 1;
        if (xBound <= 0) {
            throw new Error('FAIL: min <= max');
        }
        this.x2 = value < 0 ? 0 : value > xBound ? xBound : value;
        const value1 = this.y1 + Std.random(32) + 1;
        if (yBound <= 0) {
            throw new Error('FAIL: min <= max');
        }
        this.y2 = value1 < 0 ? 0 : value1 > yBound ? yBound : value1;
        this.angle = Math.floor(361 * Math.random());
        this.xBound = xBound;
        this.yBound = yBound;
    }

    rasterize() {
        const first = this.x1;
        const second = this.x2;
        const xm1 = first < second ? first : second;
        const first1 = this.x1;
        const second1 = this.x2;
        const xm2 = first1 > second1 ? first1 : second1;
        const first2 = this.y1;
        const second2 = this.y2;
        const ym1 = first2 < second2 ? first2 : second2;
        const first3 = this.y1;
        const second3 = this.y2;
        const ym2 = first3 > second3 ? first3 : second3;
        const cx = ((xm1 + xm2) / 2) | 0;
        const cy = ((ym1 + ym2) / 2) | 0;
        const ox1 = xm1 - cx;
        const ox2 = xm2 - cx;
        const oy1 = ym1 - cy;
        const oy2 = ym2 - cy;
        const rads = this.angle * Math.PI / 180.0;
        const c = Math.cos(rads);
        const s = Math.sin(rads);
        const ulx = (ox1 * c - oy1 * s + cx) | 0;
        const uly = (ox1 * s + oy1 * c + cy) | 0;
        const blx = (ox1 * c - oy2 * s + cx) | 0;
        const bly = (ox1 * s + oy2 * c + cy) | 0;
        const urx = (ox2 * c - oy1 * s + cx) | 0;
        const ury = (ox2 * s + oy1 * c + cy) | 0;
        const brx = (ox2 * c - oy2 * s + cx) | 0;
        const bry = (ox2 * s + oy2 * c + cy) | 0;
        return Scanline.trim(
            Rasterizer.scanlinesForPolygon([
                {
                    x: ulx,
                    y: uly
                },
                {
                    x: urx,
                    y: ury
                },
                {
                    x: brx,
                    y: bry
                },
                {
                    x: blx,
                    y: bly
                }
            ]),
            this.xBound,
            this.yBound
        );
    }

    mutate() {
        const r = Std.random(3);
        switch (r) {
            case 0:
            const value = this.x1 + (-16 + Std.random(33));
            const max = this.xBound - 1;
            if (0 > max) {
                throw new Error('FAIL: min <= max');
            }
            this.x1 = value < 0 ? 0 : value > max ? max : value;
            const value1 = this.y1 + (-16 + Std.random(33));
            const max1 = this.yBound - 1;
            if (0 > max1) {
                throw new Error('FAIL: min <= max');
            }
            this.y1 = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
            break;
            case 1:
            const value2 = this.x2 + (-16 + Std.random(33));
            const max2 = this.xBound - 1;
            if (0 > max2) {
                throw new Error('FAIL: min <= max');
            }
            this.x2 = value2 < 0 ? 0 : value2 > max2 ? max2 : value2;
            const value3 = this.y2 + (-16 + Std.random(33));
            const max3 = this.yBound - 1;
            if (0 > max3) {
                throw new Error('FAIL: min <= max');
            }
            this.y2 = value3 < 0 ? 0 : value3 > max3 ? max3 : value3;
            break;
            case 2:
            const value4 = this.angle + (-4 + Std.random(9));
            this.angle = value4 < 0 ? 0 : value4 > 360 ? 360 : value4;
            break;
        }
    }

    clone() {
        const rectangle = new RotatedRectangleShape(
            this.xBound,
            this.yBound
        );
        rectangle.x1 = this.x1;
        rectangle.y1 = this.y1;
        rectangle.x2 = this.x2;
        rectangle.y2 = this.y2;
        rectangle.angle = this.angle;
        return rectangle;
    }

    getSvgShapeData() {
        const first = this.x1;
        const second = this.x2;
        const xm1 = first < second ? first : second;
        const first1 = this.x1;
        const second1 = this.x2;
        const xm2 = first1 > second1 ? first1 : second1;
        const first2 = this.y1;
        const second2 = this.y2;
        const ym1 = first2 < second2 ? first2 : second2;
        const first3 = this.y1;
        const second3 = this.y2;
        const ym2 = first3 > second3 ? first3 : second3;
        const cx = ((xm1 + xm2) / 2) | 0;
        const cy = ((ym1 + ym2) / 2) | 0;
        const ox1 = xm1 - cx;
        const ox2 = xm2 - cx;
        const oy1 = ym1 - cy;
        const oy2 = ym2 - cy;
        const rads = this.angle * Math.PI / 180.0;
        const c = Math.cos(rads);
        const s = Math.sin(rads);
        const ulx = (ox1 * c - oy1 * s + cx) | 0;
        const uly = (ox1 * s + oy1 * c + cy) | 0;
        const blx = (ox1 * c - oy2 * s + cx) | 0;
        const bly = (ox1 * s + oy2 * c + cy) | 0;
        const urx = (ox2 * c - oy1 * s + cx) | 0;
        const ury = (ox2 * s + oy1 * c + cy) | 0;
        const brx = (ox2 * c - oy2 * s + cx) | 0;
        const bry = (ox2 * s + oy2 * c + cy) | 0;
        const points = [
            {
                x: ulx,
                y: uly
            },
            {
                x: urx,
                y: ury
            },
            {
                x: brx,
                y: bry
            },
            {
                x: blx,
                y: bly
            }
        ];
        let s1 = '<polygon points="';
        let _g1 = 0;
        const _g = points.length;
        while (_g1 < _g) {
            const i = _g1++;
            s1 += `${points[i].x} ${points[i].y}`;
            if (i != points.length - 1) {
                s1 += ' ';
            }
        }
        s1 += `" ${SvgExporter.SVG_STYLE_HOOK}/>`;
        return s1;
    }
}

RotatedRectangleShape.__interfaces__ = [Shape];

class ShapeFactory {
    static create(type, xBound, yBound) {
        switch (type) {
            case 0:
            return new RectangleShape(xBound, yBound);
            case 1:
            return new RotatedRectangleShape(xBound, yBound);
            case 2:
            return new TriangleShape(xBound, yBound);
            case 3:
            return new EllipseShape(xBound, yBound);
            case 4:
            return new RotatedEllipseShape(xBound, yBound);
            case 5:
            return new CircleShape(xBound, yBound);
            case 6:
            return new LineShape(xBound, yBound);
        }
    }

    static randomShapeOf(types, xBound, yBound) {
        if (!(types != null && types.length > 0)) {
            throw new Error('FAIL: a != null && a.length > 0');
        }
        const upper = types.length - 1;
        if (0 > upper) {
            throw new Error('FAIL: lower <= upper');
        }
        return ShapeFactory.create(
            types[Std.random(upper+1)],
            xBound,
            yBound
        );
    }
}

class TriangleShape {
    constructor(xBound, yBound) {
        this.x1 = Std.random(xBound);
        this.y1 = Std.random(yBound);
        this.x2 = this.x1 + (-16 + Std.random(33));
        this.y2 = this.y1 + (-16 + Std.random(33));
        this.x3 = this.x1 + (-16 + Std.random(33));
        this.y3 = this.y1 + (-16 + Std.random(33));
        this.xBound = xBound;
        this.yBound = yBound;
    }

    rasterize() {
        return Scanline.trim(
            Rasterizer.scanlinesForPolygon([
                {
                    x: this.x1,
                    y: this.y1
                },
                {
                    x: this.x2,
                    y: this.y2
                },
                {
                    x: this.x3,
                    y: this.y3
                }
            ]),
            this.xBound,
            this.yBound
        );
    }

    mutate() {
        const r = Std.random(3);
        switch (r) {
            case 0:
            const value = this.x1 + (-16 + Std.random(33));
            const max = this.xBound - 1;
            if (0 > max) {
                throw new Error('FAIL: min <= max');
            }
            this.x1 = value < 0 ? 0 : value > max ? max : value;
            const value1 = this.y1 + (-16 + Std.random(33));
            const max1 = this.yBound - 1;
            if (0 > max1) {
                throw new Error('FAIL: min <= max');
            }
            this.y1 = value1 < 0 ? 0 : value1 > max1 ? max1 : value1;
            break;
            case 1:
            const value2 = this.x2 + (-16 + Std.random(33));
            const max2 = this.xBound - 1;
            if (0 > max2) {
                throw new Error('FAIL: min <= max');
            }
            this.x2 = value2 < 0 ? 0 : value2 > max2 ? max2 : value2;
            const value3 = this.y2 + (-16 + Std.random(33));
            const max3 = this.yBound - 1;
            if (0 > max3) {
                throw new Error('FAIL: min <= max');
            }
            this.y2 = value3 < 0 ? 0 : value3 > max3 ? max3 : value3;
            break;
            case 2:
            const value4 = this.x3 + (-16 + Std.random(33));
            const max4 = this.xBound - 1;
            if (0 > max4) {
                throw new Error('FAIL: min <= max');
            }
            this.x3 = value4 < 0 ? 0 : value4 > max4 ? max4 : value4;
            const value5 = this.y3 + (-16 + Std.random(33));
            const max5 = this.yBound - 1;
            if (0 > max5) {
                throw new Error('FAIL: min <= max');
            }
            this.y3 = value5 < 0 ? 0 : value5 > max5 ? max5 : value5;
            break;
        }
    }

    clone() {
        const triangle = new TriangleShape(this.xBound, this.yBound);
        triangle.x1 = this.x1;
        triangle.y1 = this.y1;
        triangle.x2 = this.x2;
        triangle.y2 = this.y2;
        triangle.x3 = this.x3;
        triangle.y3 = this.y3;
        return triangle;
    }

    getSvgShapeData() {
        return `<polygon points="${this.x1},${this.y1} ${this.x2},${this.y2} ${
            this.x3
        },${this.y3}" ${SvgExporter.SVG_STYLE_HOOK}/>`;
    }
}

TriangleShape.__interfaces__ = [Shape];
const haxe_IMap = () => {};

class haxe_ds_IntMap {
    constructor() {
        this.h = {};
    }

    keys() {
        const a = [];
        for (const key in this.h)
        if (this.h.hasOwnProperty(key)) {
            a.push(key | 0);
        }
        return Std.iter(a);
    }
}

haxe_ds_IntMap.__interfaces__ = [haxe_IMap];


onmessage = GeometrizeWorker.prototype.messageHandler;
SvgExporter.SVG_STYLE_HOOK = '::svg_style_hook::';
