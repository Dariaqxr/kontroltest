document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ЛОГІКА ЖИВОГО ФОНУ ---
    const container = document.getElementById('bg-container');
    const bubbles = [];
    const bubbleCount = 15;

    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'smart-bubble';
        
        const size = Math.random() * 80 + 40;
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        bubbles.push({
            el: bubble,
            x: startX,
            y: startY,
            size: size,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5
        });
        container.appendChild(bubble);
    }

    let mouseX = -500;
    let mouseY = -500;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function moveBubbles() {
        bubbles.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;

            if (b.x < 0 || b.x > window.innerWidth - b.size) b.vx *= -1;
            if (b.y < 0 || b.y > window.innerHeight - b.size) b.vy *= -1;

            const centerX = b.x + b.size / 2;
            const centerY = b.y + b.size / 2;
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 200) {
                const angle = Math.atan2(dy, dx);
                const force = (200 - dist) / 200;
                b.x -= Math.cos(angle) * force * 10;
                b.y -= Math.sin(angle) * force * 10;
            }
            b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        });
        requestAnimationFrame(moveBubbles);
    }
    moveBubbles();

    // --- 2. ЛОГІКА ШАХІВНИЦІ ---
    const cells = document.querySelectorAll('.chess-table-final td:not(.coord)');
    let selectedCell = null;

    const pieces = {
        '♜': { type: 'rook', color: 'black' }, '♞': { type: 'knight', color: 'black' },
        '♝': { type: 'bishop', color: 'black' }, '♛': { type: 'queen', color: 'black' },
        '♚': { type: 'king', color: 'black' }, '♟': { type: 'pawn', color: 'black' },
        '♖': { type: 'rook', color: 'white' }, '♘': { type: 'knight', color: 'white' },
        '♗': { type: 'bishop', color: 'white' }, '♕': { type: 'queen', color: 'white' },
        '♔': { type: 'king', color: 'white' }, '♙': { type: 'pawn', color: 'white' }
    };

    cells.forEach((cell, index) => {
        cell.dataset.index = index;
        cell.addEventListener('click', () => handleCellClick(cell));
    });

    function handleCellClick(cell) {
        const piece = pieces[cell.innerText.trim()];

        if (selectedCell) {
            if (cell.classList.contains('possible-move')) {
                movePiece(selectedCell, cell);
                clearHighlights();
                selectedCell = null;
            } else {
                clearHighlights();
                if (piece) selectPiece(cell, piece);
                else selectedCell = null;
            }
        } else if (piece) {
            selectPiece(cell, piece);
        }
    }

    function selectPiece(cell, piece) {
        selectedCell = cell;
        cell.classList.add('selected');
        const moves = getValidMoves(cell, piece);
        moves.forEach(idx => {
            if (cells[idx]) cells[idx].classList.add('possible-move');
        });
    }

    function movePiece(from, to) {
        to.innerText = from.innerText;
        from.innerText = "";
        checkGameOver();
    }

    function clearHighlights() {
        cells.forEach(c => {
            c.classList.remove('selected', 'possible-move');
        });
    }

    function getValidMoves(cell, piece) {
        const idx = parseInt(cell.dataset.index);
        const row = Math.floor(idx / 8);
        const col = idx % 8;
        let validMoves = [];

        const directions = {
            rook: [[1,0], [-1,0], [0,1], [0,-1]],
            bishop: [[1,1], [1,-1], [-1,1], [-1,-1]],
            knight: [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]],
            king: [[1,1], [1,-1], [-1,1], [-1,-1], [1,0], [-1,0], [0,1], [0,-1]]
        };

        if (piece.type === 'rook' || piece.type === 'bishop' || piece.type === 'queen') {
            const dirs = piece.type === 'queen' ? [...directions.rook, ...directions.bishop] : directions[piece.type];
            dirs.forEach(d => {
                let r = row + d[0], c = col + d[1];
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const targetIdx = r * 8 + c;
                    const targetPiece = pieces[cells[targetIdx].innerText.trim()];
                    if (!targetPiece) {
                        validMoves.push(targetIdx);
                    } else {
                        if (targetPiece.color !== piece.color) validMoves.push(targetIdx);
                        break;
                    }
                    r += d[0]; c += d[1];
                }
            });
        }

        if (piece.type === 'knight' || piece.type === 'king') {
            directions[piece.type].forEach(d => {
                const r = row + d[0], c = col + d[1];
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const targetIdx = r * 8 + c;
                    const targetPiece = pieces[cells[targetIdx].innerText.trim()];
                    if (!targetPiece || targetPiece.color !== piece.color) validMoves.push(targetIdx);
                }
            });
        }

        if (piece.type === 'pawn') {
            const dir = piece.color === 'white' ? -1 : 1; 
            const nextR = row + dir;
            if (nextR >= 0 && nextR < 8) {
                if (!cells[nextR * 8 + col].innerText.trim()) {
                    validMoves.push(nextR * 8 + col);
                    const startRow = piece.color === 'white' ? 6 : 1;
                    const doubleNextR = row + (2 * dir);
                    if (row === startRow && !cells[doubleNextR * 8 + col].innerText.trim()) {
                        validMoves.push(doubleNextR * 8 + col);
                    }
                }
                [1, -1].forEach(dCol => {
                    const c = col + dCol;
                    if (c >= 0 && c < 8) {
                        const targetIdx = nextR * 8 + c;
                        const targetPiece = pieces[cells[targetIdx].innerText.trim()];
                        if (targetPiece && targetPiece.color !== piece.color) validMoves.push(targetIdx);
                    }
                });
            }
        }
        return validMoves;
    }

    function checkGameOver() {
        const allPiecesText = Array.from(cells).map(td => td.innerText.trim());
        const whiteKingExists = allPiecesText.includes('♔');
        const blackKingExists = allPiecesText.includes('♚');

        if (!whiteKingExists) showVictory("BLACK WINS!");
        else if (!blackKingExists) showVictory("WHITE WINS!");
    }

    function showVictory(message) {
        const chessSection = document.getElementById('chess-block');
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        overlay.innerHTML = `
            <div class="victory-card">
                <h1>VICTORY!</h1>
                <p>${message}</p>
                <button onclick="location.reload()">PLAY AGAIN</button>
            </div>
        `;
        chessSection.appendChild(overlay);
    }
});