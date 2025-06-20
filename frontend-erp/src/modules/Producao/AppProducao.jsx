import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./components/ui/button"; 
import ImportarXML from "./components/ImportarXML";
import VisualizacaoPeca from "./components/VisualizacaoPeca";
import { fetchComAuth } from "../../utils/fetchComAuth";
import Pacote from "./components/Pacote";
import Apontamento from "./components/Apontamento";
import ApontamentoVolume from "./components/ApontamentoVolume";
import EditarFerragem from "./components/EditarFerragem";
import Nesting from "./components/Nesting";
import "./Producao.css";

let globalIdProducao = parseInt(localStorage.getItem("globalPecaIdProducao")) || 1;

const HomeProducao = () => {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState(JSON.parse(localStorage.getItem("lotesProducao") || "[]"));

  const criarLote = () => {
    const nome = prompt("Digite o nome do novo lote:");
    if (!nome) return;
    if (lotes.some(l => l.nome === nome)) return alert("Nome de lote já existe.");

    const novo = { nome, pacotes: [] };
    const atualizados = [...lotes, novo];
    setLotes(atualizados);
    localStorage.setItem("lotesProducao", JSON.stringify(atualizados));
    navigate(`lote/${nome}`);
  };

  const excluirLote = (nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir o lote "${nome}"?`)) return;
    const atualizados = lotes.filter(l => l.nome !== nome);
    setLotes(atualizados);
    localStorage.setItem("lotesProducao", JSON.stringify(atualizados));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Painel de Produção Radha</h1>
      <Button onClick={criarLote}>+ Novo Lote</Button>
      <ul className="mt-4 space-y-2">
        {lotes.map((l, i) => (
          <li key={l.nome || i} className="flex justify-between items-center border p-2 rounded">
            <span>{l.nome}</span>
            <div className="space-x-2">
              <Button onClick={() => navigate(`lote/${l.nome}`)}>Editar</Button>
              <Button variant="destructive" onClick={() => excluirLote(l.nome)}>Excluir</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const LoteProducao = () => {
  const { nome } = useParams();
  const navigate = useNavigate();
  const [pacotes, setPacotes] = useState(() => {
    const lotes = JSON.parse(localStorage.getItem("lotesProducao") || "[]");
    return lotes.find(l => l.nome === nome)?.pacotes || [];
  });

  const salvarPacotes = (novosPacotes) => {
    const pacotesComIds = novosPacotes.map(pacote => {
      const pecasComIds = (pacote.pecas || []).map(p => {
        const id = globalIdProducao++;
        if (p.operacoes) {
          localStorage.setItem("op_producao_" + id, JSON.stringify(p.operacoes));
        }
        return { ...p, id };
      });
      const ferragensComIds = (pacote.ferragens || []).map(f => ({
        ...f,
        id: globalIdProducao++
      }));
      return { ...pacote, pecas: pecasComIds, ferragens: ferragensComIds };
    });

    localStorage.setItem("globalPecaIdProducao", globalIdProducao);

    const lotes = JSON.parse(localStorage.getItem("lotesProducao") || "[]");
    const atualizados = lotes.map(l =>
      l.nome === nome ? { ...l, pacotes: [...(l.pacotes || []), ...pacotesComIds] } : l
    );
    localStorage.setItem("lotesProducao", JSON.stringify(atualizados));
    setPacotes(prev => [...prev, ...pacotesComIds]);
  };

  const excluirPacote = (index) => {
    if (!window.confirm(`Tem certeza que deseja excluir este pacote?`)) return;
    const novos = pacotes.filter((_, i) => i !== index);
    const lotes = JSON.parse(localStorage.getItem("lotesProducao") || "[]");
    const atualizados = lotes.map(l =>
      l.nome === nome ? { ...l, pacotes: novos } : l
    );
    localStorage.setItem("lotesProducao", JSON.stringify(atualizados));
    setPacotes(novos);
  };

  const gerarArquivos = async () => {
    const pecas = pacotes.flatMap(p => p.pecas.map(pc => ({
      ...pc,
      operacoes: JSON.parse(localStorage.getItem("op_producao_" + pc.id) || "[]")
    })));
    const json = await fetchComAuth("/gerar-lote-final", {
      method: "POST",
      body: JSON.stringify({ lote: nome, pecas })
    });
    alert(json.mensagem);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lote: {nome}</h2>
        <Button variant="outline" onClick={() => navigate("/producao")}>Voltar para Início da Produção</Button>
      </div>

      <ImportarXML onImportarPacote={(p) => salvarPacotes([p])} />

      <ul className="space-y-2 mt-4">
        {pacotes.map((p, i) => (
          <li key={i} className="border p-2 rounded">
            <div className="flex justify-between">
              <div className="font-semibold">{p.nome_pacote || `Pacote ${i + 1}`}</div>
              <div className="space-x-2">
                <Button onClick={() => navigate(`pacote/${i}`)}>Editar</Button>
                <Button variant="destructive" onClick={() => excluirPacote(i)}>Excluir</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button className="mt-6" onClick={gerarArquivos}>Gerar Arquivos Finais</Button>
    </div>
  );
};

const EditarPecaProducao = () => {
  const { nome, peca: pecaId } = useParams();
  const navigate = useNavigate();

  const [dadosPeca, setDadosPeca] = useState(null);
  const [operacoes, setOperacoes] = useState([]);
  const [operacao, setOperacao] = useState("Retângulo");
  const [form, setForm] = useState({ comprimento: "", largura: "", profundidade: "", diametro: "", x: 0, y: 0, estrategia: "Por Dentro", posicao: "C", face: "Face (F0)" });

  useEffect(() => {
    const lotes = JSON.parse(localStorage.getItem("lotesProducao") || "[]");
    let pecaEncontrada = null;
    
    for (const l of lotes) {
      if (l.nome === nome) {
        for (const pacote of l.pacotes || []) {
          const p = pacote.pecas.find(p => p.id === parseInt(pecaId));
          if (p) {
            pecaEncontrada = p;
            break;
          }
        }
      }
      if (pecaEncontrada) break;
    }

    if (pecaEncontrada) {
      setDadosPeca(pecaEncontrada);
      const operacoesSalvas = JSON.parse(localStorage.getItem("op_producao_" + pecaId) || "[]");
      setOperacoes(operacoesSalvas);
    }
  }, [pecaId, nome]);

  const salvarOperacao = () => {
    const pos = form.posicao;
    let operacoesAtuais = [...operacoes];

    if (operacao === "Puxador Cava") {
      const originalComprimento = parseFloat(dadosPeca.comprimento);
      const originalLargura = parseFloat(dadosPeca.largura);
      let novoComprimento = originalComprimento;
      let novaLargura = originalLargura;
      const ajuste = 25;
      let painelLargura;

      if (pos === 'C') {
        novaLargura -= ajuste;
        painelLargura = originalComprimento;
      } else {
        novoComprimento -= ajuste;
        painelLargura = originalLargura;
      }

      operacoesAtuais = operacoes.map(op => {
        let opAjustada = { ...op };
        if (pos.startsWith('L') && op.x > originalComprimento / 2) { opAjustada.x -= ajuste; }
        if (pos === 'C' && op.y > originalLargura / 2) { opAjustada.y -= ajuste; }
        return opAjustada;
      });

      if (pos === "C") {
        operacoesAtuais.push({ tipo: "Retângulo", x: 0, y: 0, largura: 55, comprimento: originalComprimento, profundidade: 6.5, estrategia: "Desbaste" });
        operacoesAtuais.push({ tipo: "Linha", x: 0, y: 0, largura: 1, comprimento: originalComprimento, profundidade: 18.2, estrategia: "Linha" });
      } else {
        let x_rect1 = 0;
        let x_line1 = 0;
        if (pos === 'L3') {
            x_rect1 = novoComprimento - 55;
            x_line1 = novoComprimento - 1;
        }
        operacoesAtuais.push({ tipo: "Retângulo", x: x_rect1, y: 0, largura: originalLargura, comprimento: 55, profundidade: 6.5, estrategia: "Desbaste" });
        operacoesAtuais.push({ tipo: "Linha", x: x_line1, y: 0, largura: originalLargura, comprimento: 1, profundidade: 18.2, estrategia: "Linha" });
      }

      let newPecaId = parseInt(localStorage.getItem("globalPecaIdProducao")) || 1;
      localStorage.setItem("globalPecaIdProducao", newPecaId + 1);

      const originalMaterial = dadosPeca.material || "";
      const novoMaterialPainel = originalMaterial.replace(/\d+mm/gi, '6mm');

      const painelPuxador = {
        id: newPecaId, nome: `PAINEL PUXADOR P/ ${dadosPeca.nome}`,
        comprimento: 80, largura: painelLargura, espessura: 6,
        material: novoMaterialPainel,
        cliente: dadosPeca.cliente, ambiente: dadosPeca.ambiente,
        observacoes: `Painel complementar para puxador cava da peça ID ${pecaId}`,
        codigo_peca: dadosPeca.codigo_peca,
        operacoes: []
      };

      const lotes = JSON.parse(localStorage.getItem("lotesProducao") || "[]");
      const lotesAtualizados = lotes.map(lote =>
        lote.nome !== nome ? lote : {
          ...lote,
          pacotes: lote.pacotes.map(pacote => {
            if (!pacote.pecas.some(p => p.id === parseInt(pecaId))) return pacote;
            const pecasAtualizadas = pacote.pecas.map(p =>
              p.id === parseInt(pecaId) ? { ...p, comprimento: novoComprimento, largura: novaLargura } : p
            );
            pecasAtualizadas.push(painelPuxador);
            return { ...pacote, pecas: pecasAtualizadas };
          })
        }
      );

      localStorage.setItem("lotesProducao", JSON.stringify(lotesAtualizados));
      localStorage.setItem(`op_producao_${newPecaId}`, JSON.stringify([]));

      setDadosPeca(prev => ({ ...prev, comprimento: novoComprimento, largura: novaLargura }));

    } else if (operacao === "Corte 45 graus") {
        if (pos === "L") { operacoesAtuais.push({ tipo: "Retângulo", x: 0, y: 0, largura: dadosPeca.largura, comprimento: 2, profundidade: 18.2, estrategia: "Por Dentro" }); }
        else { operacoesAtuais.push({ tipo: "Retângulo", x: 0, y: 0, largura: 2, comprimento: dadosPeca.comprimento, profundidade: 18.2, estrategia: "Por Dentro" }); }
    } else {
      operacoesAtuais.push({ ...form, tipo: operacao });
    }

    setOperacoes(operacoesAtuais);
    localStorage.setItem("op_producao_" + pecaId, JSON.stringify(operacoesAtuais));
    setForm({ comprimento: "", largura: "", profundidade: "", diametro: "", x: 0, y: 0, estrategia: "Por Dentro", posicao: "C", face: "Face (F0)" });
  };

  const excluirTodas = () => {
    setOperacoes([]);
    localStorage.removeItem("op_producao_" + pecaId);
  };

  const excluirUma = (index) => {
    const novas = operacoes.filter((_, i) => i !== index);
    setOperacoes(novas);
    localStorage.setItem("op_producao_" + pecaId, JSON.stringify(novas));
  };

  if (!dadosPeca) return <p className="p-6">Peça não encontrada ou carregando...</p>;

  const orientacao = parseFloat(dadosPeca.comprimento) >= parseFloat(dadosPeca.largura) ? "horizontal" : "vertical";
  const cores = ["blue", "green", "orange", "purple"];

  const campos = () => {
    if (["Puxador Cava", "Corte 45 graus"].includes(operacao)) {
      return (
        <label className="block mt-2">Extremidade:
          <select className="input" value={form.posicao} onChange={e => setForm({ ...form, posicao: e.target.value })}>
            <option value="C">Comprimento (C)</option>
            <option value="L1">Largura (L1)</option>
            <option value="L3">Largura (L3)</option>
          </select></label>
      );
    }
    if (["Retângulo", "Círculo", "Furo", "Linha"].includes(operacao)) {
        const camposComuns = <>
            <label className="block mt-2">Face:
                <select className="input" value={form.face} onChange={e => setForm({ ...form, face: e.target.value })}>
                    <option value="Face (F0)">Face (F0)</option>
                    <option value="Topo (L1)">Topo (L1)</option>
                    <option value="Topo (L3)">Topo (L3)</option>
                </select>
            </label>
            <label className="block mt-2">X:
                <input type="number" className="input" value={form.x} onChange={e => setForm({ ...form, x: e.target.value })} />
            </label>
            <label className="block mt-2">Y:
                <input type="number" className="input" value={form.y} onChange={e => setForm({ ...form, y: e.target.value })} />
            </label>
            <label className="block mt-2">Profundidade:
                <input type="number" className="input" value={form.profundidade} onChange={e => setForm({ ...form, profundidade: e.target.value })} />
            </label>
        </>;

        if (operacao === "Círculo" || operacao === "Furo") {
            return <>
                {camposComuns}
                <label className="block mt-2">Diâmetro:
                    <input type="number" className="input" value={form.diametro} onChange={e => setForm({ ...form, diametro: e.target.value })} />
                </label>
            </>;
        }

        if (operacao === "Retângulo" || operacao === "Linha") {
            return <>
                {camposComuns}
                <label className="block mt-2">Comprimento:
                    <input type="number" className="input" value={form.comprimento} onChange={e => setForm({ ...form, comprimento: e.target.value })} />
                </label>
                <label className="block mt-2">Largura:
                    <input type="number" className="input" value={form.largura} onChange={e => setForm({ ...form, largura: e.target.value })} />
                </label>
            </>;
        }
    }
    return null;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-medium mb-2">Peça: {dadosPeca.nome}</h3>
      <div className="border p-4 rounded bg-gray-50 overflow-x-auto w-full min-w-[620px]">
        <VisualizacaoPeca comprimento={dadosPeca.comprimento} largura={dadosPeca.largura} orientacao={orientacao} operacoes={operacoes} />
        <p className="mt-2">Medidas: {dadosPeca.comprimento}mm x {dadosPeca.largura}mm</p>
        <label className="block mt-4">Operação:
          <select className="input" value={operacao} onChange={e => setOperacao(e.target.value)}>
            <option>Retângulo</option>
            <option>Círculo</option>
            <option>Furo</option>
            <option>Linha</option>
            <option>Puxador Cava</option>
            <option>Corte 45 graus</option>
          </select></label>

        {campos()}

        { !["Puxador Cava", "Corte 45 graus"].includes(operacao) && (operacao === "Furo" ? <p className="mt-2">Estratégia: Por Dentro</p> : (
            <label className="block mt-2">Estratégia:
              <select className="input" value={form.estrategia} onChange={e => setForm({ ...form, estrategia: e.target.value })}>
                <option>Por Dentro</option>
                <option>Por Fora</option>
                <option>Desbaste</option>
                {operacao === "Linha" && <option>Linha</option>}
              </select></label>
          ))
        }
        <div className="flex gap-2 mt-4">
          <Button onClick={salvarOperacao}>Salvar Operação</Button>
          <Button variant="outline" onClick={() => navigate(`/producao/lote/${nome}`)}>Finalizar</Button>
          <Button variant="destructive" onClick={excluirTodas}>Excluir Todas</Button>
        </div>

        <ul className="mt-4 space-y-1 text-sm">
          {operacoes.map((op, i) => {
            let detalhes = `@ (${op.x}, ${op.y})`;
            if (op.tipo === "Retângulo" || op.tipo === "Linha") {
              detalhes += ` - ${op.largura} x ${op.comprimento}mm`;
            } else if (op.tipo === "Círculo" || op.tipo === "Furo") {
              detalhes += ` - Ø ${op.diametro}mm`;
            }
            if (op.profundidade) {
              detalhes += ` - Prof: ${op.profundidade}mm`;
            }

            return (
              <li key={i} className="flex justify-between">
                <span style={{ color: cores[i % cores.length] }}>
                  {op.tipo} {detalhes}
                </span>
                <Button size="sm" variant="ghost" onClick={() => excluirUma(i)}>Excluir</Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// Reexporta os componentes para uso no index.jsx do módulo
export { HomeProducao, LoteProducao, EditarPecaProducao, Pacote, Apontamento, ApontamentoVolume, EditarFerragem, ImportarXML, VisualizacaoPeca, Nesting };
