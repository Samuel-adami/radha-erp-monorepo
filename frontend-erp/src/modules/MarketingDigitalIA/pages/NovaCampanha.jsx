import React, { useState, useEffect } from 'react';
import { fetchComAuth } from "../../../utils/fetchComAuth";

function NovaCampanha() {
  const [tema, setTema] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [publicosAlvo, setPublicosAlvo] = useState([]);
  const [orcamento, setOrcamento] = useState('');
  const [duracao, setDuracao] = useState('');
  const [resposta, setResposta] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregarPublicosAlvo = async () => {
      try {
        const dados = await fetchComAuth('/publicos/');
        setPublicosAlvo(dados);
      } catch (err) {
        setErro('Erro ao carregar públicos-alvo: ' + err.message);
      }
    };

    carregarPublicosAlvo();
  }, []);

  const enviar = async () => {
    setErro('');
    setResposta('');

    const dados = {
      tema,
      objetivo,
      publico_alvo: publicoAlvo,
      orcamento: parseFloat(orcamento) || 0,
      duracao,
      id_assistant: 'asst_OuBtdCCByhjfqPFPZwMK6d9y'
    };

    try {
      const resultado = await fetchComAuth('/nova-campanha/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });

      setResposta(resultado.campanha);
    } catch (err) {
      setErro(err.message || JSON.stringify(err));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nova Campanha</h1>

      <input
        className="w-full border rounded px-3 py-2 mb-2"
        placeholder="Tema da campanha"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
      />

      <select
        className="w-full border rounded px-3 py-2 mb-2"
        value={objetivo}
        onChange={(e) => setObjetivo(e.target.value)}
      >
        <option value="">Selecione o Objetivo</option>
        <option value="Engajamento">Engajamento</option>
        <option value="Reconhecimento de Marca">Reconhecimento de Marca</option>
        <option value="Conversões">Conversões</option>
        <option value="Lançamento de Produto">Lançamento de Produto</option>
      </select>

      <select
        className="w-full border rounded px-3 py-2 mb-2"
        value={publicoAlvo}
        onChange={(e) => setPublicoAlvo(e.target.value)}
      >
        <option value="">Selecione o Público-Alvo</option>
        {publicosAlvo.map((publico) => (
          <option key={publico.id} value={publico.nome}>
            {publico.nome}
          </option>
        ))}
      </select>

      <input
        type="number"
        step="0.01"
        className="w-full border rounded px-3 py-2 mb-2"
        placeholder="Orçamento (R$)"
        value={orcamento}
        onChange={(e) => setOrcamento(e.target.value)}
      />

      <input
        className="w-full border rounded px-3 py-2 mb-2"
        placeholder="Duração"
        value={duracao}
        onChange={(e) => setDuracao(e.target.value)}
      />

      <button
        onClick={enviar}
        className="bg-purple-900 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Criar Campanha
      </button>

      {resposta && (
        <div className="mt-4 p-4 bg-green-100 text-green-900 rounded whitespace-pre-wrap">
          <strong>Resposta:</strong><br />{resposta}
        </div>
      )}

      {erro && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Erro: {erro}
        </div>
      )}
    </div>
  );
}

export default NovaCampanha;
