import React, { useState } from "react";
import { Button } from "./ui/button";

const gerarCodigoVolume = () => {
  const atual = parseInt(localStorage.getItem("globalVolumeId") || "1");
  localStorage.setItem("globalVolumeId", atual + 1);
  return `VOL${String(atual).padStart(6, "0")}`;
};

const ApontamentoVolume = () => {
  const lotes = JSON.parse(localStorage.getItem("lotesProducao") || "[]");
  const [lote, setLote] = useState("");
  const [pacoteIndex, setPacoteIndex] = useState("");
  const [codigo, setCodigo] = useState("");
  const [emVolume, setEmVolume] = useState([]);
  const pacotes = lote ? (lotes.find(l => l.nome === lote)?.pacotes || []) : [];
  const pacote = pacotes[parseInt(pacoteIndex)] || null;
  const [volumes, setVolumes] = useState(() => pacote?.volumes || []);

  const salvarVolumes = novos => {
    const lotesAtualizados = lotes.map(l => {
      if (l.nome !== lote) return l;
      return {
        ...l,
        pacotes: l.pacotes.map((p, i) =>
          i !== parseInt(pacoteIndex) ? p : { ...p, volumes: novos }
        ),
      };
    });
    localStorage.setItem("lotesProducao", JSON.stringify(lotesAtualizados));
  };

  const registrarCodigo = e => {
    e.preventDefault();
    if (!pacote) return;
    const cod = codigo.trim();
    if (!cod) return;

    if (cod === "999999") {
      if (emVolume.length > 0) {
        const codigoVolume = gerarCodigoVolume();
        const novo = { codigo: codigoVolume, pecas: emVolume };
        const novos = [...volumes, novo];
        setVolumes(novos);
        salvarVolumes(novos);
        setEmVolume([]);
      }
    } else {
      const peca = pacote.pecas.find(p => String(p.codigo_peca) === cod);
      if (peca) {
        if (!emVolume.includes(peca.id) && !volumes.some(v => v.pecas.includes(peca.id))) {
          setEmVolume([...emVolume, peca.id]);
        }
      } else {
        alert("Código não encontrado no pacote");
      }
    }
    setCodigo("");
  };

  const pecasMarcadas = new Set([
    ...emVolume,
    ...volumes.flatMap(v => v.pecas),
  ]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Apontamento de Volumes</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          className="input sm:w-48"
          value={lote}
          onChange={e => {
            setLote(e.target.value);
            setPacoteIndex("");
            setEmVolume([]);
            setVolumes([]);
          }}
        >
          <option value="">Selecione o Lote</option>
          {lotes.map(l => (
            <option key={l.nome} value={l.nome}>{l.nome}</option>
          ))}
        </select>
        {pacotes.length > 0 && (
          <select
            className="input sm:w-48"
            value={pacoteIndex}
            onChange={e => {
              setPacoteIndex(e.target.value);
              const p = pacotes[parseInt(e.target.value)];
              setVolumes(p?.volumes || []);
              setEmVolume([]);
            }}
          >
            <option value="">Selecione o Pacote</option>
            {pacotes.map((p, i) => (
              <option key={i} value={i}>{p.nome_pacote || `Pacote ${i + 1}`}</option>
            ))}
          </select>
        )}
      </div>
      {pacote && (
        <>
          <form onSubmit={registrarCodigo} className="mb-4">
            <input
              className="input w-full sm:w-64"
              placeholder="Código de Barras"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              autoFocus
            />
          </form>
          <div className="flex flex-col md:flex-row gap-4">
            <ul className="space-y-1 max-h-96 overflow-y-auto flex-grow">
              {pacote.pecas.map(p => (
                <li
                  key={p.id}
                  className={`border rounded p-2 ${pecasMarcadas.has(p.id) ? 'bg-green-200' : ''}`}
                >
                  <span className="font-mono mr-2">{p.codigo_peca}</span>
                  {p.nome}
                </li>
              ))}
            </ul>
            <div className="flex-shrink-0 w-full md:w-64">
              <h3 className="font-semibold mb-2">Volumes</h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {volumes.map((v, idx) => (
                  <li key={idx} className="border rounded p-2">
                    <div className="font-medium">Volume {idx + 1} - <span className="font-mono">{v.codigo}</span></div>
                    <ul className="list-disc ml-4">
                      {v.pecas.map(id => {
                        const pc = pacote.pecas.find(p => p.id === id);
                        return pc ? (
                          <li key={id}>{pc.nome} ({pc.codigo_peca})</li>
                        ) : null;
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ApontamentoVolume;
