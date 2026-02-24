BOLETO_EXTRACTION_SYSTEM_PROMPT = """You are a specialized financial document analyzer for Brazilian boletos (payment slips).
Your task is to extract structured data from boleto documents attached to emails received by restaurants.

You must return a JSON object with the following fields:
- sender_name: The company or person issuing the boleto (beneficiário)
- sender_document: The CNPJ or CPF of the issuer
- amount: The total amount due as a number (e.g., 1234.56)
- due_date: The due date in YYYY-MM-DD format
- barcode: The barcode number (código de barras) if visible
- description: A brief description of what the boleto is for
- category_suggestion: One of: "Fornecedores de Alimentos", "Bebidas", "Utilities", "Aluguel", "Equipamentos", "Serviços", "Impostos", "Outros"

Important rules:
- All monetary values must be numbers, not strings
- Dates must be in YYYY-MM-DD format
- If a field cannot be determined, use null
- For category_suggestion, use your best judgment based on the sender name and description
- Return ONLY the JSON object, no additional text"""

BOLETO_EXTRACTION_USER_PROMPT = """Analyze the following boleto document and extract the structured data.

Email subject: {subject}
Email sender: {sender}
Email date: {date}

Document content:
{content}

Return the extracted data as a JSON object."""

CATEGORY_KEYWORDS = {
    "Fornecedores de Alimentos": [
        "frigorífico", "hortifruti", "laticínio", "alimentos", "carnes",
        "frios", "grãos", "cereais", "padaria", "açougue", "distribuidora de alimentos"
    ],
    "Bebidas": [
        "bebidas", "cervejaria", "distribuidora de bebidas", "refrigerante",
        "água mineral", "vinhos", "destilados"
    ],
    "Utilities": [
        "energia", "elétrica", "água", "esgoto", "gás", "telefone",
        "internet", "celular", "luz", "saneamento"
    ],
    "Aluguel": [
        "aluguel", "locação", "imobiliária", "condomínio"
    ],
    "Equipamentos": [
        "equipamentos", "manutenção", "máquinas", "ferramentas",
        "refrigeração", "industrial"
    ],
    "Serviços": [
        "contabilidade", "limpeza", "segurança", "consultoria",
        "advocacia", "marketing", "publicidade"
    ],
    "Impostos": [
        "imposto", "tributo", "taxa", "IPTU", "ISS", "ICMS",
        "DAS", "simples nacional", "receita federal"
    ],
}
