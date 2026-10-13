document.addEventListener('DOMContentLoaded', () => {
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayername = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-player');
    const jumpTip = document.getElementById('jump-tip');
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
});
    // modais e telas
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');


    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');
    // variáveis de estado
    let currentPlayer = '';
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;
    // recuperação do último nome de usuário utilizado
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    function startGame() {
        // limpei loops anteriores, se existirem
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        // resetei as posições visuais
        resetElements();

        isPlaying = true;
        score = 0;
        scoreDisplay.textContent = '0';
        hudPlayername.textContent = currentPlayer || 'Jogador';
        // ativa as animações css do jogo.
        gameBoard.classList.add('running');
        //loop de pontuação pregressiva, 1 ponto a cada 100ms
        scoreLoop = setInterval(() => {
            if(isPlaying){
                score += 1;
                scoreDisplay.textContent = score;
            }
        }, 100); 
        // loop de colisão
        gameLoop = setInterval(checkColision, 10);
    }
    // resetar os estilos e posições do mario e do obstáculo
    function resetElements(){
        // reseta o obstáculo
        pipe.style.animation = '';
        pipe.style.left = '';

        // reseta o mario
        mario.arc = '../assets/mario.gif';
        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.width = '';
        mario.style.marginLeft = '';
        mario.classList.remove('jump');
        if (jumpTip){
        jumpTip.style.opacity = '1';
        }
    }
    // executa o pulo do mario
    function jump(){
        if(!isPlaying) return;
        if(mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if(jumpTip){
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 500);
    }
    // verificar a colisão entre o mario e o obstaculo
    function checkColision(){
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');
        // tolerancia de colisão: quando o obstaculo esta na faixa de contato com o mario
        if(pipePosition <= 120 && pipePosition > 0 && marioPosition < 80){
            triggerGameOver(pipePosition, marioPosition);
        }

    }
    // tratar o gameOver
    function triggerGameOver(pipePosition, marioPosition){
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        // remover a classe running para parar as animações
        gameBoard.classList.remove('running');
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;
        // congela o mario na altura exata e muda para a imagem de game over
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.score = '../assets/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';
        // atualização do modal de game over
        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'Salvando pontuação no banco...'
        saveStatusMsg.style.color = #ffcc00;

        gameoverModal.classList.add('active');
        // salva a pontuação no banco com a função criada chamada saveScore
        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore){
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: {
                'Content-Type':'aplicayion/json'
            },
            body: JSON.stringfy({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success'){
                saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                saveStatusMsg.style.color = '#10b981';
                if(data.ranking){
                    renderRanking(data.ranking, playerName, finalScore);
                }
            } else {
                saveStatusMsg.textContent = (data.message || 'Erro ao registrar');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição', err);
            saveStatusMsg.textContent = 'Erro ao conectar ao servidor.';
            saveStatusMsg.style.color = '#af4444';
        });
    }
    // busca no ranking atualizado do banco
    function fetchRanking(){
        fetch('obter_ranking.php')
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success' && data.ranking){
                renderRanking(data.ranking);
            }
        })
        .catch(err => console.error('Erro ao buscar o ranking', err));
    }
    // vamos atualizar a tabela do ranking no HTML
    function renderRanking(list, highlightName = null, highlightScore = null){
        if(!rankingBody) return;
        rankingBody.innerHTML = '';
        if(!list || list.length === 0){
            rankingBody.innerHTML = `<tr><td colspan="3" class="loading-cell"> Nenhuma pontuação grvada ainda</td></tr>`;
            return;
        }

        let highlightted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if(!highlightted && highlightName && item.nome === highlightName && parseInt(item.pontos, 10) === highlightScore){
                tr.classList.add('highlight-current');
                highlightted = true;
            }

            let medal = `${index +1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);

        });
    }

    function escapeHtml(str){
        if (!str) retur '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // eventos de controle e interface do jogo
    // INICIAR O JOGO (FORMULÁRIO)
    startForm.addEventListener('submit', (e) =>{
        // e.preventDefault(); impede o recarregamento da página

        const nameValue = playerInput.value.trim();
        if(!nameValue) {
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem('mario_jump_player', currentPlayer);
        // fecha a tela e começa o jogo
        starModal.classList.remove('active');
        startGame();
    });

    // BOTÃO VER RANKING





















// document.addEventListener('click', () => {
//     alert("Eitcha clicou na página!")
// })