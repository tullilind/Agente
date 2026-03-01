// ==========================================
// 1. BANCO DE DADOS & AUTENTICAÇÃO
// ==========================================
const AuthEngine = {
    dbKey: 'meuagente_db',
    loggedKey: 'meuagente_logado',

    getUsuarios: () => JSON.parse(localStorage.getItem('meuagente_db')) || [],
    salvarUsuarios: (usuarios) => localStorage.setItem('meuagente_db', JSON.stringify(usuarios)),

    registrar: function(usuario, senha) {
        const usuarios = this.getUsuarios();
        if (usuarios.find(u => u.usuario === usuario)) return false;
        
        usuarios.push({ 
            usuario, senha, termosAceitos: false, groqApiKey: '',
            systemPrompt: 'Você é um assistente virtual super inteligente. Você anota tarefas e finanças do usuário invisivelmente através das ferramentas, sempre avisando no chat de forma natural.',
            tarefas: [], despesas: [], historicoChat: []
        });
        this.salvarUsuarios(usuarios);
        return true;
    },

    logar: function(usuario, senha) {
        const user = this.getUsuarios().find(u => u.usuario === usuario && u.senha === senha);
        if (user) { localStorage.setItem(this.loggedKey, JSON.stringify(user)); return true; }
        return false;
    },

    getUsuarioLogado: () => JSON.parse(localStorage.getItem('meuagente_logado')),

    atualizarDadosSessao: function(dadosAtualizados) {
        let logado = this.getUsuarioLogado();
        if(logado) {
            const novoPerfil = { ...logado, ...dadosAtualizados };
            localStorage.setItem(this.loggedKey, JSON.stringify(novoPerfil));
            let usuarios = this.getUsuarios();
            let index = usuarios.findIndex(u => u.usuario === logado.usuario);
            if(index !== -1) { usuarios[index] = novoPerfil; this.salvarUsuarios(usuarios); }
        }
    },
    travar: function() { localStorage.removeItem(this.loggedKey); }
};

// ==========================================
// 2. MOTOR DE BACKUP (JSON)
// ==========================================
const MotorBackup = {
    exportar: function() {
        const blob = new Blob([JSON.stringify(localStorage)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `backup_agente_${new Date().getTime()}.json`;
        a.click(); URL.revokeObjectURL(url);
    },
    importar: function(arquivo) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const dados = JSON.parse(e.target.result);
                localStorage.clear();
                for (let key in dados) localStorage.setItem(key, dados[key]);
                alert("Backup restaurado com sucesso!");
                window.location.reload();
            } catch (err) { alert("Arquivo corrompido."); }
        };
        reader.readAsText(arquivo);
    }
};

// ==========================================
// 3. UI, ANIMAÇÕES E CÉREBRO DA IA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    const logado = AuthEngine.getUsuarioLogado();

    // Redirecionamentos de Segurança Múltiplas Páginas
    if (document.getElementById('pagina-login')) {
        if (logado) window.location.href = logado.termosAceitos ? 'agente.html' : 'termos.html';
        
        document.getElementById('btn-registrar').addEventListener('click', () => {
            const user = document.getElementById('input-user').value.trim();
            const pass = document.getElementById('input-pass').value.trim();
            if(AuthEngine.registrar(user, pass)) { AuthEngine.logar(user, pass); window.location.href = 'termos.html'; }
            else alert("Usuário já existe!");
        });
        document.getElementById('btn-logar').addEventListener('click', () => {
            const user = document.getElementById('input-user').value.trim();
            const pass = document.getElementById('input-pass').value.trim();
            if(AuthEngine.logar(user, pass)) window.location.href = AuthEngine.getUsuarioLogado().termosAceitos ? 'agente.html' : 'termos.html';
            else alert("Dados incorretos!");
        });
        return;
    } 
    
    if (document.getElementById('pagina-termos')) {
        if (!logado) window.location.href = 'index.html';
        document.getElementById('btn-aceitar-termos').addEventListener('click', () => {
            AuthEngine.atualizarDadosSessao({ termosAceitos: true });
            window.location.href = 'agente.html';
        });
        return;
    }

    if (document.getElementById('pagina-agente')) {
        if (!logado || !logado.termosAceitos) { window.location.href = 'index.html'; return; }

        const chatBox = document.getElementById('chat-box');
        const inputChat = document.getElementById('input-mensagem');
        
        // ANIMAÇÕES DO AGENTE (PUPILAS)
        const pupilaEsq = document.getElementById('pupila-esq');
        const pupilaDir = document.getElementById('pupila-dir');
        
        function olharPara(direcao) {
            if(!pupilaEsq) return;
            let tr = 'translate(-50%, -50%)'; 
            if (direcao === 'cima') tr = 'translate(-50%, -100%)';
            else if (direcao === 'baixo') tr = 'translate(-50%, 0%)';
            else if (direcao === 'esquerda') tr = 'translate(-100%, -50%)';
            else if (direcao === 'direita') tr = 'translate(0%, -50%)';

            pupilaEsq.style.transform = tr;
            pupilaDir.style.transform = tr;
        }

        // RENDERIZA MENSAGENS NO CHAT
        function addMensagemUI(texto, remetente) {
            if (remetente === 'system') {
                const div = document.createElement('div');
                div.className = 'msg-sistema'; div.textContent = texto;
                chatBox.appendChild(div);
            } else {
                const linha = document.createElement('div');
                linha.className = `mensagem-linha ${remetente === 'user' ? 'msg-direita' : ''}`;
                
                let avatar = remetente === 'agente' 
                    ? `<div class="avatar-chat avatar-agente"><span class="material-symbols-outlined">smart_toy</span></div>`
                    : `<div class="avatar-chat avatar-user">${logado.usuario.charAt(0).toUpperCase()}</div>`;

                const balao = `<div class="mensagem-balao ${remetente === 'user' ? 'balao-user' : 'balao-agente'}">${texto.replace(/\n/g, '<br>')}</div>`;
                
                linha.innerHTML = remetente === 'user' ? balao + avatar : avatar + balao;
                chatBox.appendChild(linha);
                
                if (remetente === 'agente') {
                    olharPara('cima'); // O agente levanta os olhos quando fala
                    setTimeout(() => olharPara('centro'), 1000);
                }
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // CARREGA O HISTÓRICO NO INÍCIO
        if (logado.historicoChat.length === 0) {
            addMensagemUI("Olá! Eu sou seu Agente. Como posso te ajudar hoje? Posso anotar tarefas, despesas ou ver o clima!", "system");
        } else {
            logado.historicoChat.forEach(msg => { if (msg.role !== 'system') addMensagemUI(msg.content, msg.role); });
        }

        // =================================================================
        // O CÉREBRO DA INTELIGÊNCIA ARTIFICIAL (FUNCIONALIDADES INTEGRADAS)
        // =================================================================
        const FerramentasIA = [
            { type: "function", function: { name: "adicionar_tarefa", description: "Adiciona uma nova tarefa na lista do usuário.", parameters: { type: "object", properties: { descricao: { type: "string" } }, required: ["descricao"] } } },
            { type: "function", function: { name: "listar_tarefas", description: "Lê e retorna a lista de tarefas anotadas para o usuário.", parameters: { type: "object", properties: {} } } },
            { type: "function", function: { name: "registrar_despesa", description: "Registra um gasto ou despesa.", parameters: { type: "object", properties: { descricao: { type: "string" }, valor: { type: "number" } }, required: ["descricao", "valor"] } } },
            { type: "function", function: { name: "listar_despesas", description: "Lista todas as despesas financeiras atuais do usuário.", parameters: { type: "object", properties: {} } } },
            { type: "function", function: { name: "consultar_clima", description: "Consulta a previsão do tempo atual via API aberta.", parameters: { type: "object", properties: {} } } }
        ];

        async function chamarMotorGroq(mensagemUsuario) {
            if (!logado.groqApiKey) throw new Error("API_KEY_FALTANDO");

            logado.historicoChat.push({ role: "user", content: mensagemUsuario });
            addMensagemUI(mensagemUsuario, 'user');
            
            const msgPensandoId = "pensando-" + Date.now();
            const divPensando = document.createElement('div');
            divPensando.className = 'msg-sistema'; divPensando.id = msgPensandoId; divPensando.textContent = "Processando informações...";
            chatBox.appendChild(divPensando);
            chatBox.scrollTop = chatBox.scrollHeight;
            olharPara('direita'); // Agente pensando

            let mensagensParaAPI = [{ role: "system", content: logado.systemPrompt }, ...logado.historicoChat];

            try {
                let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${logado.groqApiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile", // Modelo robusto da Groq
                        messages: mensagensParaAPI,
                        tools: FerramentasIA,
                        tool_choice: "auto",
                        temperature: 0.7
                    })
                });

                if (!response.ok) throw new Error("GROQ_ERROR");
                
                let data = await response.json();
                let mensagemResposta = data.choices[0].message;

                // SE A IA DECIDIR USAR UMA FERRAMENTA (Ex: "Adicionar tarefa", "Ver clima")
                if (mensagemResposta.tool_calls) {
                    mensagensParaAPI.push(mensagemResposta);
                    document.getElementById(msgPensandoId).textContent = "Acessando sistema...";

                    for (const toolCall of mensagemResposta.tool_calls) {
                        const nomeFuncao = toolCall.function.name;
                        const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
                        let resultadoAcao = "";

                        // Executa as ações na memória invisível do navegador
                        if (nomeFuncao === "adicionar_tarefa") {
                            logado.tarefas.push(args.descricao);
                            AuthEngine.atualizarDadosSessao({ tarefas: logado.tarefas });
                            resultadoAcao = "Tarefa salva com sucesso na memória.";
                        } 
                        else if (nomeFuncao === "listar_tarefas") {
                            resultadoAcao = logado.tarefas.length > 0 ? `Tarefas atuais: ${logado.tarefas.join(", ")}` : "A lista de tarefas está vazia.";
                        }
                        else if (nomeFuncao === "registrar_despesa") {
                            logado.despesas.push({ desc: args.descricao, valor: args.valor });
                            AuthEngine.atualizarDadosSessao({ despesas: logado.despesas });
                            resultadoAcao = "Despesa registrada com sucesso no banco de dados.";
                        }
                        else if (nomeFuncao === "listar_despesas") {
                            let total = logado.despesas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
                            resultadoAcao = logado.despesas.length > 0 ? `Despesas: ${JSON.stringify(logado.despesas)}. Total: R$ ${total}` : "Nenhuma despesa registrada.";
                        }
                        else if (nomeFuncao === "consultar_clima") {
                            const resClima = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-20.8489&longitude=-41.1128&current_weather=true`);
                            const dadosClima = await resClima.json();
                            resultadoAcao = `Clima: ${dadosClima.current_weather.temperature}°C`;
                        }

                        // Devolve a informação de volta para a IA ler
                        mensagensParaAPI.push({ role: "tool", tool_call_id: toolCall.id, name: nomeFuncao, content: resultadoAcao });
                    }

                    // Chama a IA mais uma vez para ela formular a frase pro usuário
                    let segundaResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${logado.groqApiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: mensagensParaAPI, temperature: 0.7 })
                    });
                    
                    data = await segundaResponse.json();
                    mensagemResposta = data.choices[0].message;
                }

                // REMOVE AVISO "PROCESSANDO" E MOSTRA RESPOSTA FINAL DA IA NO CHAT
                document.getElementById(msgPensandoId).remove();
                olharPara('centro');
                
                logado.historicoChat.push({ role: "assistant", content: mensagemResposta.content });
                AuthEngine.atualizarDadosSessao({ historicoChat: logado.historicoChat });
                addMensagemUI(mensagemResposta.content, 'agente');

            } catch (error) {
                document.getElementById(msgPensandoId).remove();
                olharPara('centro');
                if(error.message === "API_KEY_FALTANDO") {
                    addMensagemUI("⚠️ Preciso da minha Chave API do Groq para funcionar. Clique na engrenagem ali em cima.", "system");
                } else {
                    addMensagemUI("⚠️ Erro de conexão com meu cérebro neural. Verifique a internet ou a chave da API.", "system");
                }
            }
        }

        document.getElementById('btn-enviar').addEventListener('click', () => {
            if(inputChat.value.trim()) chamarMotorGroq(inputChat.value.trim());
        });
        
        inputChat.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && inputChat.value.trim()) chamarMotorGroq(inputChat.value.trim());
        });

        // Configurações, Modais e Backups
        const modal = document.getElementById('modal-config');
        document.getElementById('btn-config').addEventListener('click', () => {
            document.getElementById('config-api-key').value = logado.groqApiKey;
            document.getElementById('config-prompt').value = logado.systemPrompt;
            modal.style.display = 'flex';
        });
        document.getElementById('btn-fechar-modal').addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('btn-salvar-config').addEventListener('click', () => {
            AuthEngine.atualizarDadosSessao({ 
                groqApiKey: document.getElementById('config-api-key').value.trim(), 
                systemPrompt: document.getElementById('config-prompt').value.trim() 
            });
            alert("Configurações atualizadas!"); modal.style.display = 'none';
        });

        document.getElementById('btn-exportar').addEventListener('click', MotorBackup.exportar);
        document.getElementById('btn-importar-trigger').addEventListener('click', () => document.getElementById('input-importar').click());
        document.getElementById('input-importar').addEventListener('change', (e) => {
            if (e.target.files.length > 0) MotorBackup.importar(e.target.files[0]);
        });
        
        document.getElementById('btn-travar').addEventListener('click', () => {
            AuthEngine.travar(); window.location.href = 'index.html';
        });
    }
});
