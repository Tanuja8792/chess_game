import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm";

(() => {
  const mount = document.getElementById("chess-scene");
  if (!mount) return;

  try {
    const game = new Chess();
    const params = new URLSearchParams(window.location.search);
    let playMode = params.get("mode") === "computer" ? "computer" : "local";
    let aiThinking = false;
    const computerDepth = 2;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111813);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(7.8, 8.8, 10.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-label", "3D chess board. Click a piece and then a highlighted square.");
    mount.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff2d7, 0x253329, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffdfaa, 3.2);
    keyLight.position.set(-5, 11, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x8ba98d, 1.2, 22);
    fillLight.position.set(5, 5, -5);
    scene.add(fillLight);

    const board = new THREE.Group();
    const pieces = new THREE.Group();
    scene.add(board, pieces);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const squares = [];
    let pieceGroups = [];
    let selected = null;
    let targets = [];
    let flipped = false;

    const materials = {
      light: new THREE.MeshStandardMaterial({ color: 0xe4d4b3, roughness: 0.78 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x58735d, roughness: 0.82 }),
      edge: new THREE.MeshStandardMaterial({ color: 0x342719, roughness: 0.55 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf5ead2, metalness: 0.12, roughness: 0.3 }),
      black: new THREE.MeshStandardMaterial({ color: 0x202923, metalness: 0.22, roughness: 0.28 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xe2bd70, metalness: 0.3, roughness: 0.3, emissive: 0x4b3210 })
    };

    const base = new THREE.Mesh(new THREE.BoxGeometry(8.35, 0.38, 8.35), materials.edge);
    base.position.y = -0.22;
    base.receiveShadow = true;
    board.add(base);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.18, 1),
          (row + col) % 2 ? materials.dark : materials.light
        );
        square.position.set(col - 3.5, 0, row - 3.5);
        square.userData.square = "abcdefgh"[col] + (8 - row);
        square.receiveShadow = true;
        board.add(square);
        squares.push(square);
      }
    }

    function addMesh(group, geometry, material, y) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    function createPiece(type, color) {
      const group = new THREE.Group();
      const material = color === "w" ? materials.white : materials.black;

      addMesh(group, new THREE.CylinderGeometry(0.25, 0.32, 0.12, 28), material, 0.16);
      addMesh(group, new THREE.CylinderGeometry(0.17, 0.23, 0.22, 28), material, 0.32);

      if (type === "p") {
        addMesh(group, new THREE.CylinderGeometry(0.12, 0.17, 0.2, 20), material, 0.48);
        addMesh(group, new THREE.SphereGeometry(0.15, 20, 16), material, 0.63);
      } else if (type === "r") {
        addMesh(group, new THREE.CylinderGeometry(0.18, 0.22, 0.48, 24), material, 0.63);
        addMesh(group, new THREE.CylinderGeometry(0.25, 0.25, 0.1, 4), material, 0.93);
      } else if (type === "n") {
        addMesh(group, new THREE.CylinderGeometry(0.16, 0.22, 0.34, 24), material, 0.55);
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.52, 4), material);
        head.position.set(0, 0.91, -0.04);
        head.rotation.z = -0.25;
        head.castShadow = true;
        group.add(head);
      } else if (type === "b") {
        addMesh(group, new THREE.CylinderGeometry(0.13, 0.22, 0.46, 24), material, 0.58);
        addMesh(group, new THREE.SphereGeometry(0.19, 20, 16), material, 0.88);
        addMesh(group, new THREE.ConeGeometry(0.1, 0.2, 16), materials.gold, 1.08);
      } else if (type === "q") {
        addMesh(group, new THREE.CylinderGeometry(0.14, 0.23, 0.55, 24), material, 0.62);
        addMesh(group, new THREE.SphereGeometry(0.22, 20, 16), material, 1.0);
        addMesh(group, new THREE.ConeGeometry(0.1, 0.22, 16), materials.gold, 1.2);
      } else if (type === "k") {
        addMesh(group, new THREE.CylinderGeometry(0.15, 0.24, 0.58, 24), material, 0.64);
        addMesh(group, new THREE.SphereGeometry(0.2, 20, 16), material, 1.0);
        addMesh(group, new THREE.BoxGeometry(0.09, 0.42, 0.09), materials.gold, 1.34);
        addMesh(group, new THREE.BoxGeometry(0.32, 0.09, 0.09), materials.gold, 1.34);
      }

      return group;
    }

    function squarePosition(square) {
      const col = "abcdefgh".indexOf(square[0]);
      const row = 8 - Number(square[1]);
      return { x: col - 3.5, z: row - 3.5 };
    }

    function paintSquares() {
      squares.forEach(mesh => {
        const square = mesh.userData.square;
        const row = 8 - Number(square[1]);
        const col = "abcdefgh".indexOf(square[0]);
        const baseMaterial = (row + col) % 2 ? materials.dark : materials.light;
        mesh.material = selected === square || targets.includes(square) ? materials.gold : baseMaterial;
      });
    }

    function drawPieces() {
      while (pieces.children.length) pieces.remove(pieces.children[0]);
      pieceGroups = [];

      game.board().forEach((row, rowIndex) => {
        row.forEach((piece, colIndex) => {
          if (!piece) return;
          const square = "abcdefgh"[colIndex] + (8 - rowIndex);
          const group = createPiece(piece.type, piece.color);
          const pos = squarePosition(square);
          group.position.set(pos.x, 0.1, pos.z);
          group.userData.square = square;
          pieces.add(group);
          pieceGroups.push(group);
        });
      });
      paintSquares();
    }

    function updateInterface() {
      const over = game.isGameOver();
      let message = game.isCheckmate()
        ? "Checkmate — " + (game.turn() === "w" ? "Black" : "White") + " wins."
        : game.isStalemate()
          ? "Draw — stalemate."
          : game.isThreefoldRepetition()
            ? "Draw — threefold repetition."
            : game.isInsufficientMaterial()
              ? "Draw — insufficient material."
              : game.isDraw()
                ? "Draw."
                : (game.turn() === "w" ? "White" : "Black") + " to move";

      if (game.isCheck() && !over) message += " · Check";
      document.getElementById("status").textContent = message;
      document.getElementById("hint").textContent = over
        ? "The match is complete. Start a new game to play again."
        : (playMode === "computer" && game.turn() === "b" ? "Computer is choosing its move…" : "Select a " + (game.turn() === "w" ? "white" : "black") + " piece to reveal its legal moves.");

      document.getElementById("black-card").querySelector("b").textContent = playMode === "computer" ? "Computer" : "Player 2";
      document.getElementById("white-card").querySelector("b").textContent = playMode === "computer" ? "You" : "Player 1";
      document.getElementById("mode-label").textContent = playMode === "computer" ? "PLAYER VS COMPUTER" : "PLAYER VS PLAYER";
      document.getElementById("white-card").classList.toggle("active-player", game.turn() === "w" && !over);
      document.getElementById("black-card").classList.toggle("active-player", game.turn() === "b" && !over);

      const history = game.history();
      const list = document.getElementById("move-list");
      list.replaceChildren();
      if (!history.length) {
        const item = document.createElement("li");
        item.className = "empty-moves";
        item.textContent = "Your moves will appear here.";
        list.appendChild(item);
      } else {
        for (let i = 0; i < history.length; i += 2) {
          const item = document.createElement("li");
          const number = document.createElement("b");
          number.textContent = (Math.floor(i / 2) + 1) + ". ";
          item.append(number, document.createTextNode(history[i] + (history[i + 1] ? "   " + history[i + 1] : "")));
          list.appendChild(item);
        }
      }
      document.getElementById("move-count").textContent = history.length + (history.length === 1 ? " ply" : " plies");
      document.getElementById("undo-btn").disabled = history.length === 0;
    }

    function selectSquare(square) {
      if (game.isGameOver() || aiThinking || (playMode === "computer" && game.turn() === "b")) return;
      const piece = game.get(square);

      if (selected && targets.includes(square)) {
        const movingPiece = game.get(selected);
        let promotion = "q";
        if (movingPiece && movingPiece.type === "p" && (square[1] === "8" || square[1] === "1")) {
          const choice = (window.prompt("Promote pawn to queen (q), rook (r), bishop (b), or knight (n)?", "q") || "q").toLowerCase();
          if (!["q", "r", "b", "n"].includes(choice)) return;
          promotion = choice;
        }
        try {
          game.move({ from: selected, to: square, promotion });
        } catch (error) {
          console.warn("Move rejected:", error);
        }
        selected = null;
        targets = [];
        drawPieces();
        updateInterface();
        makeComputerMove();
        return;
      }

      if (piece && piece.color === game.turn()) {
        selected = square;
        targets = game.moves({ square, verbose: true }).map(move => move.to);
      } else {
        selected = null;
        targets = [];
      }
      paintSquares();
    }


    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    function evaluatePosition() {
      if (game.isCheckmate()) return game.turn() === "w" ? -100000 : 100000;
      if (game.isDraw()) return 0;
      let score = 0;
      game.board().forEach(row => row.forEach(piece => {
        if (piece) score += (piece.color === "w" ? 1 : -1) * pieceValues[piece.type];
      }));
      return score;
    }
    function searchBestMove(depth, alpha, beta, maximizing) {
      if (depth === 0 || game.isGameOver()) return evaluatePosition();
      const moves = game.moves({ verbose: true });
      if (maximizing) {
        let best = -Infinity;
        for (const move of moves) {
          game.move(move);
          best = Math.max(best, searchBestMove(depth - 1, alpha, beta, false));
          game.undo();
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
        return best;
      }
      let best = Infinity;
      for (const move of moves) {
        game.move(move);
        best = Math.min(best, searchBestMove(depth - 1, alpha, beta, true));
        game.undo();
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    function makeComputerMove() {
      if (playMode !== "computer" || game.turn() !== "b" || game.isGameOver() || aiThinking) return;
      aiThinking = true;
      updateInterface();
      window.setTimeout(() => {
        let bestMove = null;
        let bestScore = Infinity;
        for (const move of game.moves({ verbose: true })) {
          game.move(move);
          const score = searchBestMove(computerDepth - 1, -Infinity, Infinity, true);
          game.undo();
          if (score < bestScore) { bestScore = score; bestMove = move; }
        }
        if (bestMove) game.move({ from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion || "q" });
        aiThinking = false;
        selected = null;
        targets = [];
        drawPieces();
        updateInterface();
      }, 450);
    }

    renderer.domElement.addEventListener("click", event => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...pieceGroups, ...squares], true);
      if (!hits.length) return;
      let object = hits[0].object;
      while (object && object.userData.square === undefined) object = object.parent;
      if (object && object.userData.square) selectSquare(object.userData.square);
    });

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    renderer.domElement.addEventListener("pointerdown", event => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    });
    renderer.domElement.addEventListener("pointerup", () => { dragging = false; });
    renderer.domElement.addEventListener("pointercancel", () => { dragging = false; });
    renderer.domElement.addEventListener("pointermove", event => {
      if (!dragging || event.buttons !== 1) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      const spherical = new THREE.Spherical().setFromVector3(camera.position);
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.35, Math.min(1.35, spherical.phi + dy * 0.006));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    });
    renderer.domElement.addEventListener("wheel", event => {
      event.preventDefault();
      camera.position.multiplyScalar(event.deltaY > 0 ? 1.06 : 0.94);
      camera.position.clampLength(7, 19);
      camera.lookAt(0, 0, 0);
    }, { passive: false });

    document.getElementById("reset-btn").addEventListener("click", () => {
      game.reset();
      aiThinking = false;
      selected = null;
      targets = [];
      drawPieces();
      updateInterface();
    });
    document.getElementById("undo-btn").addEventListener("click", () => {
      if (game.history().length) {
        game.undo();
        if (playMode === "computer" && game.turn() === "b" && game.history().length) game.undo();
      }
      aiThinking = false;
      selected = null;
      targets = [];
      drawPieces();
      updateInterface();
    });
    document.getElementById("flip-btn").addEventListener("click", () => {
      flipped = !flipped;
      camera.position.set(flipped ? -7.8 : 7.8, 8.8, flipped ? -10.5 : 10.5);
      camera.lookAt(0, 0, 0);
    });

    function resize() {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(mount);
    else window.addEventListener("resize", resize);

    document.getElementById("mode-select").value = playMode;
    document.getElementById("mode-select").addEventListener("change", event => {
      window.location.href = window.location.pathname + "?mode=" + event.target.value;
    });
    resize();
    drawPieces();
    updateInterface();

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  } catch (error) {
    console.error("Unable to start the 3D chess arena:", error);
    mount.innerHTML = '<div class="scene-error"><b>Chess arena could not start.</b><small>Check your internet connection, then refresh the page. If the issue continues, open the browser console and share the error.</small></div>';
  }
})();