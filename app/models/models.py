YEARS = ["2023", "2024", "2025", "2026"]

quadStatus = {
    "2023": ["completo", "completo", "completo"],
    "2024": ["completo", "completo", "completo"],
    "2025": ["completo", "completo", "completo"],
    "2026": ["completo", "parcial", "pendente"],
}

anualStatus = {
    "2023": "completo",
    "2024": "completo",
    "2025": "completo",
    "2026": "pendente",
}

dashboardData = {
    "I01": {
        "name": "Percentual de den\u00fancias de ass\u00e9dio moral",
        "formula": "(V01 / V02) \u00d7 100",
        "periodicidade": "Quadrimestral",
        "granularidade": "Mensal, com consolida\u00e7\u00e3o quadrimestral",
        "sentidoBom": "baixo",
        "coletasValidas": 39,
        "meta": 20,
        "limiteAceitavel": 30,
        "observacao": None,
        "vars": {
            "V01": {"label": "Den\u00fancias de ass\u00e9dio moral", "data": {"2023": [6, 7, 7], "2024": [7, 6, 7], "2025": [5, 5, 4], "2026": [3, 3, None]}},
            "V02": {"label": "Total de den\u00fancias", "data": {"2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, None]}},
        },
    },
    "I02": {
        "name": "Percentual de den\u00fancias de ass\u00e9dio sexual",
        "formula": "(V03 / V02) \u00d7 100",
        "periodicidade": "Quadrimestral",
        "granularidade": "Mensal, com consolida\u00e7\u00e3o quadrimestral",
        "sentidoBom": "baixo",
        "coletasValidas": 39,
        "meta": 10,
        "limiteAceitavel": 15,
        "observacao": "No Documento de Requisitos, a vari\u00e1vel V03 do I02 est\u00e1 descrita como \"Den\u00fancias de ass\u00e9dio moral\" \u2014 prov\u00e1vel erro de digita\u00e7\u00e3o da ficha original, j\u00e1 que I02 trata de ass\u00e9dio sexual. Corrigido aqui; recomenda-se validar com a PRGC antes de publicar.",
        "vars": {
            "V03": {"label": "Den\u00fancias de ass\u00e9dio sexual", "data": {"2023": [3, 3, 3], "2024": [4, 3, 3], "2025": [2, 2, 2], "2026": [1, 1, None]}},
            "V02": {"label": "Total de den\u00fancias", "data": {"2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, None]}},
        },
    },
    "I03": {
        "name": "Efetividade de apura\u00e7\u00e3o de den\u00fancias recebidas",
        "formula": "(V04 / V02) \u00d7 100",
        "periodicidade": "Quadrimestral",
        "granularidade": "Mensal, com consolida\u00e7\u00e3o quadrimestral",
        "sentidoBom": "alto",
        "coletasValidas": 39,
        "meta": 85,
        "limiteAceitavel": 70,
        "observacao": "Aplicar os crit\u00e9rios de admissibilidade da Instru\u00e7\u00e3o Normativa n\u00ba 04/2012-CGDF na apura\u00e7\u00e3o das den\u00fancias, conforme ressalva do documento de requisitos.",
        "vars": {
            "V04": {"label": "Den\u00fancias apuradas e tratadas", "data": {"2023": [11, 13, 15], "2024": [17, 15, 20], "2025": [17, 20, 19], "2026": [17, 15, None]}},
            "V02": {"label": "Total de den\u00fancias", "data": {"2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, None]}},
        },
    },
    "I04": {
        "name": "Atendimento da Lei 6.112/2018 (Integridade das Contratadas)",
        "formula": "(V06 / V05) \u00d7 100",
        "periodicidade": "Anual",
        "granularidade": "Anual",
        "sentidoBom": "alto",
        "coletasValidas": 3,
        "meta": None,
        "limiteAceitavel": None,
        "observacao": None,
        "vars": {
            "V05": {"label": "Contratos enviados \u00e0 CGDF", "data": {"2023": 40, "2024": 55, "2025": 60, "2026": None}},
            "V06": {"label": "Contratos enquadrados", "data": {"2023": 26, "2024": 45, "2025": 58, "2026": None}},
        },
    },
    "I05": {
        "name": "Percentual de empregados e membros dos \u00f3rg\u00e3os estatut\u00e1rios treinados",
        "formula": "(V07 / V08) \u00d7 100",
        "periodicidade": "Anual",
        "granularidade": "Anual",
        "sentidoBom": "alto",
        "coletasValidas": 3,
        "meta": None,
        "limiteAceitavel": None,
        "observacao": None,
        "vars": {
            "V07": {"label": "Empregados/membros treinados", "data": {"2023": 165, "2024": 250, "2025": 320, "2026": None}},
            "V08": {"label": "Total de empregados-membros", "data": {"2023": 300, "2024": 320, "2025": 340, "2026": None}},
        },
    },
    "I06": {
        "name": "Percentual de evas\u00e3o no treinamento de compliance",
        "formula": "(V09 / V10) \u00d7 100",
        "periodicidade": "Anual",
        "granularidade": "Anual",
        "sentidoBom": "baixo",
        "coletasValidas": 3,
        "meta": None,
        "limiteAceitavel": None,
        "observacao": "Vari\u00e1vel ajustada: V09 antes duplicava indevidamente V08 na ficha original. Corrigido para refletir evas\u00f5es sobre vagas ofertadas (V10).",
        "vars": {
            "V09": {"label": "Evas\u00f5es", "data": {"2023": 33, "2024": 25, "2025": 14, "2026": None}},
            "V10": {"label": "Vagas ofertadas", "data": {"2023": 150, "2024": 180, "2025": 200, "2026": None}},
        },
    },
    "I07": {
        "name": "Percentual de den\u00fancias de nepotismo",
        "formula": "(V11 / V02) \u00d7 100",
        "periodicidade": "Quadrimestral",
        "granularidade": "Mensal, com consolida\u00e7\u00e3o quadrimestral",
        "sentidoBom": "baixo",
        "coletasValidas": 39,
        "meta": 8,
        "limiteAceitavel": 12,
        "observacao": "Vari\u00e1vel ajustada: V11 antes era identificada como V10 na ficha original.",
        "vars": {
            "V11": {"label": "Den\u00fancias de nepotismo", "data": {"2023": [2, 2, 2], "2024": [2, 2, 2], "2025": [2, 2, 1], "2026": [1, 1, None]}},
            "V02": {"label": "Total de den\u00fancias", "data": {"2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, None]}},
        },
    },
    "I08": {
        "name": "Percentual de den\u00fancias sobre conflito de interesse",
        "formula": "(V12 / V02) \u00d7 100",
        "periodicidade": "Quadrimestral",
        "granularidade": "Mensal, com consolida\u00e7\u00e3o quadrimestral",
        "sentidoBom": "baixo",
        "coletasValidas": 39,
        "meta": 12,
        "limiteAceitavel": 18,
        "observacao": "Vari\u00e1vel ajustada: V12 antes era identificada como V11 na ficha original.",
        "vars": {
            "V12": {"label": "Den\u00fancias de conflito de interesses", "data": {"2023": [3, 4, 4], "2024": [4, 3, 4], "2025": [3, 3, 2], "2026": [2, 1, None]}},
            "V02": {"label": "Total de den\u00fancias", "data": {"2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, None]}},
        },
    },
    "I09": {
        "name": "Percentual de proced\u00eancia de den\u00fancias",
        "formula": "(V13 / V02 anual) \u00d7 100",
        "periodicidade": "Anual",
        "granularidade": "Anual",
        "sentidoBom": "alto",
        "coletasValidas": 3,
        "meta": None,
        "limiteAceitavel": None,
        "observacao": "Vari\u00e1vel ajustada: V13 antes era identificada como V12 na ficha original. O denominador (V02) \u00e9 o total de den\u00fancias do ANO INTEIRO, obtido somando os 3 quadrimestres j\u00e1 apurados em I01. Sentido de leitura (percentual alto = positivo, pois indica apura\u00e7\u00e3o eficaz) ainda precisa ser confirmado com a PRGC \u2014 pode tamb\u00e9m ser lido como alerta se a maioria das den\u00fancias for procedente.",
        "externalDenominator": "I01.V02",
        "vars": {
            "V13": {"label": "Den\u00fancias procedentes", "data": {"2023": 24, "2024": 44, "2025": 53, "2026": None}},
        },
    },
    "I10": {
        "name": "Percentual de PAD, TCE, sindic\u00e2ncia e apura\u00e7\u00e3o \u00e9tica com penalidade",
        "formula": "(V14 / V15) \u00d7 100",
        "periodicidade": "Anual",
        "granularidade": "Anual",
        "sentidoBom": "alto",
        "coletasValidas": 3,
        "meta": None,
        "limiteAceitavel": None,
        "observacao": "Vari\u00e1veis ajustadas: V14 antes era identificada como V13 e V15 antes era identificada como V14 na ficha original.",
        "vars": {
            "V14": {"label": "Den\u00fancias com penalidade", "data": {"2023": 11, "2024": 28, "2025": 47, "2026": None}},
            "V15": {"label": "Den\u00fancias enviadas", "data": {"2023": 30, "2024": 45, "2025": 55, "2026": None}},
        },
    },
}

formulas = {
    "I01": "(V01 / V02) * 100",
    "I02": "(V03 / V02) * 100",
    "I03": "(V04 / V02) * 100",
    "I04": "(V06 / V05) * 100",
    "I05": "(V07 / V08) * 100",
    "I06": "(V09 / V10) * 100",
    "I07": "(V11 / V02) * 100",
    "I08": "(V12 / V02) * 100",
    "I09": "(V13 / V02) * 100",
    "I10": "(V14 / V15) * 100",
}

integrityPairs = {
    "I01": ["V01", "V02"], "I02": ["V03", "V02"], "I03": ["V04", "V02"],
    "I04": ["V06", "V05"], "I05": ["V07", "V08"], "I06": ["V09", "V10"],
    "I07": ["V11", "V02"], "I08": ["V12", "V02"], "I09": ["V13", "V02"],
    "I10": ["V14", "V15"],
}

yearColors = {
    "2023": "#cccccc",
    "2024": "var(--navy)",
    "2025": "var(--sky)",
    "2026": "#333333",
}
