// here define functions to draw points and lines 

Viva.Graph.View.webglDualColorLine = function (t, e) {
    return {
        start: Viva.Graph.View._webglUtil.parseColor(t),
        end: Viva.Graph.View._webglUtil.parseColor(e)
    }
}
Viva.Graph.View.webglDualColorLinkProgram = function () {
    var t, e, r, i, n, a, o, s, u, c, d = 6,
        l = 2 * (2 * Float32Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT),
        f = ["precision mediump float;", "varying vec4 color;", "void main(void) {", "   gl_FragColor = color;", "}"].join("\n"),
        p = ["attribute vec2 a_vertexPos;", "attribute vec4 a_color;", "uniform vec2 u_screenSize;", "uniform mat4 u_transform;", "varying vec4 color;", "void main(void) {", "   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0.0, 1.0);", "   color = a_color.abgr;", "}"].join("\n"),
        h = 0,
        g = new ArrayBuffer(1024 * l),
        v = new Float32Array(g),
        m = new Uint32Array(g),
        w = function () {
            if ((h + 1) * l > g.byteLength) {
                var t = new ArrayBuffer(2 * g.byteLength),
                    e = new Float32Array(t),
                    r = new Uint32Array(t);
                r.set(m), v = e, m = r, g = t
            }
        };
    return {
        load: function (a) {
            e = a, e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA), e.enable(e.BLEND), i = Viva.Graph.webgl(a), t = i.createProgram(p, f), e.useProgram(t), n = i.getLocations(t, ["a_vertexPos", "a_color", "u_screenSize", "u_transform"]), e.enableVertexAttribArray(n.vertexPos), e.enableVertexAttribArray(n.color), r = e.createBuffer()
        },
        position: function (t, e, r) {
            var i = t.id,
                n = i * d;
            v[n] = e.x, v[n + 1] = e.y, m[n + 2] = t.start, v[n + 3] = r.x, v[n + 4] = r.y, m[n + 5] = t.end
        },
        createLink: function (t) {
            w(), h += 1, a = t.id
        },
        removeLink: function (t) {
            h > 0 && (h -= 1), h > t.id && h > 0 && i.copyArrayPart(m, t.id * d, h * d, d)
        },
        updateTransform: function (t) {
            c = !0, u = t
        },
        updateSize: function (t, e) {
            o = t, s = e, c = !0
        },
        render: function () {
            e.useProgram(t), e.bindBuffer(e.ARRAY_BUFFER, r), e.bufferData(e.ARRAY_BUFFER, g, e.DYNAMIC_DRAW), c && (c = !1, e.uniformMatrix4fv(n.transform, !1, u), e.uniform2f(n.screenSize, o, s)), e.vertexAttribPointer(n.vertexPos, 2, e.FLOAT, !1, 3 * Float32Array.BYTES_PER_ELEMENT, 0), e.vertexAttribPointer(n.color, 4, e.UNSIGNED_BYTE, !0, 3 * Float32Array.BYTES_PER_ELEMENT, 8), e.drawArrays(e.LINES, 0, 2 * h), a = h - 1
        },
        bringToFront: function (t) {
            a > t.id && i.swapArrayPart(m, t.id * d, a * d, d), a > 0 && (a -= 1)
        },
        getFrontLinkId: function () {
            return a
        }
    }
}
//Viva.Graph.View.webglCustomNodeProgram = function () {
function buildCircleNodeShader() {
    var t, e, r, i, n, a, o, s, u, 
        c = 4,
        d = [
            "precision mediump float;", 
            "varying vec4 color;",
            "varying float pixelSize;", 
    
            "void main(void) {", 
            "   if (gl_PointCoord.x <= pixelSize || gl_PointCoord.x >= 1.0-pixelSize || gl_PointCoord.y <= pixelSize || gl_PointCoord.y >= 1. - pixelSize) {", 
            "     gl_FragColor = vec4(color.xyz * 0.3, 1);", 
            "   } else {", 
            "     gl_FragColor = color;", "   }", 
            "}"].join("\n"),
        
        
        l = [
            "attribute vec2 a_vertexPos;", 
            "attribute vec2 a_customAttributes;", 
            "uniform vec2 u_screenSize;", 
            "uniform mat4 u_transform;", 
            "varying vec4 color;", 
            "varying float pixelSize;",

            "void main(void) {", 
            "   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0, 1);", 
            "   gl_PointSize = a_customAttributes[1] * u_transform[0][0];", 
            "   float c = a_customAttributes[0];", 
            "   color.b = mod(c, 256.0); c = floor(c/256.0);", 
            "   color.g = mod(c, 256.0); c = floor(c/256.0);", 
            "   color.r = mod(c, 256.0); c = floor(c/256.0); color /= 255.0;", 
            "   color.a = 1.0;", 
            "   pixelSize = 1.0/gl_PointSize;", 
            "}"].join("\n"),

        f = new Float32Array(64),
        p = 0;

    return {
        load: function (a) {
            e = a, n = Viva.Graph.webgl(a), 
            t = n.createProgram(l, d), 
            e.useProgram(t), 
            i = n.getLocations(t, ["a_vertexPos", "a_customAttributes", "u_screenSize", "u_transform"]), 
            e.enableVertexAttribArray(i.vertexPos), 
            e.enableVertexAttribArray(i.customAttributes), 
            r = e.createBuffer()
        },
        position: function (t, e) {
            var r = t.id;
            f[r * c] = e.x, f[r * c + 1] = e.y, f[r * c + 2] = t.color, f[r * c + 3] = t.size
        },
        updateTransform: function (t) {
            u = !0, s = t
        },
        updateSize: function (t, e) {
            a = t, o = e, u = !0
        },
        createNode: function () {
            f = n.extendArray(f, p, c), p += 1
        },
        removeNode: function (t) {
            p > 0 && (p -= 1), p > t.id && p > 0 && n.copyArrayPart(f, t.id * c, p * c, c)
        },
        replaceProperties: function () {},
        render: function () {
            e.useProgram(t), 
            e.bindBuffer(e.ARRAY_BUFFER, r), 
            e.bufferData(e.ARRAY_BUFFER, f, e.DYNAMIC_DRAW),
            u && (u = !1, e.uniformMatrix4fv(i.transform, !1, s), e.uniform2f(i.screenSize, a, o)),
            e.vertexAttribPointer(i.vertexPos, 2, e.FLOAT, !1, c * Float32Array.BYTES_PER_ELEMENT, 0), 
                
            e.vertexAttribPointer(i.customAttributes, 2, e.FLOAT, !1, c * Float32Array.BYTES_PER_ELEMENT, 8), 
            e.drawArrays(e.POINTS, 0, p)
        }
    }
}

Viva.Graph.View.webglCustomNodeProgram = function () {
//function buildCircleNodeShader() {
    // For each primitive we need 4 attributes: x, y, color and size.
    var ATTRIBUTES_PER_PRIMITIVE = 4,
        nodesFS = [
        'precision mediump float;',
        'varying vec4 color;',
        'void main(void) {',
        //"   if (gl_PointCoord.x <= pixelSize || gl_PointCoord.x >= 1.0-pixelSize || gl_PointCoord.y <= pixelSize || gl_PointCoord.y >= 1. - pixelSize) {", 
        '   if ((gl_PointCoord.x - 0.5) * (gl_PointCoord.x - 0.5) + (gl_PointCoord.y - 0.5) * (gl_PointCoord.y - 0.5) < 0.25) {',
        '     gl_FragColor = color;',
        '   } else {',
        '     gl_FragColor = vec4(0);',
        '   }',
        '}'].join('\n'),
        nodesVS = [
        'attribute vec2 a_vertexPos;',
        // Pack color and size into vector. First elemnt is color, second - size.
        // Since it's floating point we can only use 24 bit to pack colors...
        // thus alpha channel is dropped, and is always assumed to be 1.
        'attribute vec2 a_customAttributes;',
        'uniform vec2 u_screenSize;',
        'uniform mat4 u_transform;',
        'varying vec4 color;',
        'void main(void) {',
        '   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0, 1);',
        '   gl_PointSize = a_customAttributes[1] * u_transform[0][0];',
        '   float c = a_customAttributes[0];',
        '   color.b = mod(c, 256.0); c = floor(c/256.0);',
        '   color.g = mod(c, 256.0); c = floor(c/256.0);',
        '   color.r = mod(c, 256.0); c = floor(c/256.0); color /= 255.0;',
        '   color.a = 0.3;',
        '}'].join('\n');
    var program,
        gl,
        buffer,
        locations,
        utils,
        nodes = new Float32Array(64),
        nodesCount = 0,
        canvasWidth, canvasHeight, transform,
        isCanvasDirty;
    return {
        /**
         * Called by webgl renderer to load the shader into gl context.
         */
        load : function (glContext) {
            gl = glContext;
            webglUtils = Viva.Graph.webgl(glContext);
            program = webglUtils.createProgram(nodesVS, nodesFS);
            gl.useProgram(program);
            locations = webglUtils.getLocations(program, ['a_vertexPos', 'a_customAttributes', 'u_screenSize', 'u_transform']);
            gl.enableVertexAttribArray(locations.vertexPos);
            gl.enableVertexAttribArray(locations.customAttributes);
            buffer = gl.createBuffer();
        },
        /**
         * Called by webgl renderer to update node position in the buffer array
         *
         * @param nodeUI - data model for the rendered node (WebGLCircle in this case)
         * @param pos - {x, y} coordinates of the node.
         */
        position : function (nodeUI, pos) {
            var idx = nodeUI.id;
            nodes[idx * ATTRIBUTES_PER_PRIMITIVE] = pos.x;
            nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 1] = -pos.y;
            nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 2] = nodeUI.color;
            nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 3] = nodeUI.size;
        },
        /**
         * Request from webgl renderer to actually draw our stuff into the
         * gl context. This is the core of our shader.
         */
        render : function() {
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, nodes, gl.DYNAMIC_DRAW);
            if (isCanvasDirty) {
                isCanvasDirty = false;
                gl.uniformMatrix4fv(locations.transform, false, transform);
                gl.uniform2f(locations.screenSize, canvasWidth, canvasHeight);
            }
            gl.vertexAttribPointer(locations.vertexPos, 2, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 0);
            gl.vertexAttribPointer(locations.customAttributes, 2, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 2 * 4);
            gl.drawArrays(gl.POINTS, 0, nodesCount);
        },
        /**
         * Called by webgl renderer when user scales/pans the canvas with nodes.
         */
        updateTransform : function (newTransform) {
            transform = newTransform;
            isCanvasDirty = true;
        },
        /**
         * Called by webgl renderer when user resizes the canvas with nodes.
         */
        updateSize : function (newCanvasWidth, newCanvasHeight) {
            canvasWidth = newCanvasWidth;
            canvasHeight = newCanvasHeight;
            isCanvasDirty = true;
        },
        /**
         * Called by webgl renderer to notify us that the new node was created in the graph
         */
        createNode : function (node) {
            nodes = webglUtils.extendArray(nodes, nodesCount, ATTRIBUTES_PER_PRIMITIVE);
            nodesCount += 1;
        },
        /**
         * Called by webgl renderer to notify us that the node was removed from the graph
         */
        removeNode : function (node) {
            if (nodesCount > 0) { nodesCount -=1; }
            if (node.id < nodesCount && nodesCount > 0) {
                // we do not really delete anything from the buffer.
                // Instead we swap deleted node with the "last" node in the
                // buffer and decrease marker of the "last" node. Gives nice O(1)
                // performance, but make code slightly harder than it could be:
                webglUtils.copyArrayPart(nodes, node.id*ATTRIBUTES_PER_PRIMITIVE, nodesCount*ATTRIBUTES_PER_PRIMITIVE, ATTRIBUTES_PER_PRIMITIVE);
            }
        },
        /**
         * This method is called by webgl renderer when it changes parts of its
         * buffers. We don't use it here, but it's needed by API (see the comment
         * in the removeNode() method)
         */
        replaceProperties : function(replacedNode, newNode) {},
    };
}