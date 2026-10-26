import { axes as englishAxes, questions as englishQuestions } from './content.js';

const axisTranslations = {
  economic: {
    name: 'Economia',
    left: 'Igualdade',
    right: 'Mercados',
    description: 'Como a sociedade deve equilibrar a igualdade econômica e a liberdade de mercado?',
    leftDescription: 'Você dá mais importância à redução da desigualdade econômica por meio de serviços públicos, redistribuição e proteção aos trabalhadores.',
    rightDescription: 'Você dá mais importância à concorrência, à iniciativa privada e à liberdade de escolha econômica individual.',
  },
  authority: {
    name: 'Liberdades civis',
    left: 'Liberdade',
    right: 'Autoridade',
    description: 'Até que ponto a liberdade individual deve ceder à ordem pública?',
    leftDescription: 'Você dá mais importância à liberdade pessoal, aos direitos civis e aos limites do poder do Estado.',
    rightDescription: 'Você dá mais importância à ordem pública, a regras que possam ser efetivamente aplicadas e à capacidade do governo de manter as pessoas seguras.',
  },
  governance: {
    name: 'Tomada de decisões',
    left: 'Democracia',
    right: 'Tecnocracia',
    description: 'Quem deve ter mais voz nas decisões públicas?',
    leftDescription: 'Você prefere ampla participação popular e decisões pelas quais os responsáveis continuem a prestar contas aos eleitores.',
    rightDescription: 'Você prefere dar um papel maior nas decisões a especialistas com conhecimento e experiência relevantes.',
  },
  diplomacy: {
    name: 'Relações internacionais',
    left: 'Cooperação',
    right: 'Soberania',
    description: 'Como os países devem equilibrar regras compartilhadas e independência nacional?',
    leftDescription: 'Você prefere a cooperação internacional e compromissos compartilhados para resolver problemas que ultrapassam fronteiras.',
    rightDescription: 'Você prefere o controle nacional sobre leis, recursos e compromissos internacionais.',
  },
  force: {
    name: 'Segurança',
    left: 'Diplomacia',
    right: 'Militarismo',
    description: 'Qual deve ser o papel do poder militar na prevenção e na resolução de conflitos?',
    leftDescription: 'Você prefere a negociação, a prevenção de conflitos e a moderação no uso da força militar.',
    rightDescription: 'Você prefere um elevado grau de prontidão militar e maior disposição para usar a força em favor da segurança.',
  },
  borders: {
    name: 'Migração',
    left: 'Abertura',
    right: 'Restrição',
    description: 'Até que ponto um país deve estar aberto às pessoas que desejam se mudar para ele?',
    leftDescription: 'Você prefere facilitar a migração legal e ampliar as oportunidades para que os recém-chegados se estabeleçam e participem da sociedade.',
    rightDescription: 'Você prefere regras de entrada mais rígidas e maior controle sobre o ritmo e a dimensão da imigração.',
  },
  culture: {
    name: 'Mudança social',
    left: 'Progresso',
    right: 'Tradição',
    description: 'Como a sociedade deve ponderar novas normas sociais e costumes estabelecidos?',
    leftDescription: 'Você prefere adaptar as instituições e as normas sociais à medida que as pessoas desenvolvem novas formas de viver.',
    rightDescription: 'Você prefere preservar os costumes estabelecidos e abordar as mudanças sociais com cautela.',
  },
  religion: {
    name: 'Religião e vida pública',
    left: 'Laicidade',
    right: 'Influência religiosa',
    description: 'Quanta influência as tradições religiosas devem ter nas políticas públicas?',
    leftDescription: 'Você prefere instituições públicas e leis que funcionem independentemente de doutrinas religiosas.',
    rightDescription: 'Você prefere um papel relevante para as tradições religiosas e os ensinamentos morais nas decisões públicas.',
  },
  environment: {
    name: 'Meio ambiente',
    left: 'Ecologia',
    right: 'Crescimento',
    description: 'Como a proteção ambiental deve ser ponderada em relação à expansão econômica?',
    leftDescription: 'Você dá mais importância aos limites ecológicos e à proteção ambiental quando entram em conflito com o crescimento.',
    rightDescription: 'Você dá mais importância ao emprego, a custos acessíveis e à expansão econômica quando os objetivos ambientais exigem escolhas entre prioridades.',
  },
  justice: {
    name: 'Justiça criminal',
    left: 'Reabilitação',
    right: 'Punição',
    description: 'O que o sistema de justiça criminal deve priorizar após uma infração?',
    leftDescription: 'Você prefere reduzir a reincidência por meio de tratamento, educação e reintegração à sociedade.',
    rightDescription: 'Você prefere penas proporcionais, responsabilização e desestímulo à prática de crimes como objetivos centrais da justiça.',
  },
  structure: {
    name: 'Distribuição de poder',
    left: 'Descentralização',
    right: 'Centralização',
    description: 'Em qual nível a maioria das decisões públicas deve ser tomada?',
    leftDescription: 'Você prefere dar às comunidades locais e regionais mais autonomia sobre suas próprias decisões.',
    rightDescription: 'Você prefere coordenar as decisões em âmbito nacional para garantir consistência e atender a necessidades compartilhadas.',
  },
  technology: {
    name: 'Tecnologia',
    left: 'Precaução',
    right: 'Aceleração',
    description: 'Como a sociedade deve equilibrar os riscos das novas tecnologias e seus possíveis benefícios?',
    leftDescription: 'Você prefere salvaguardas mais rigorosas e evidências de segurança antes que tecnologias de grande capacidade sejam amplamente adotadas.',
    rightDescription: 'Você prefere acelerar a experimentação e a adoção, adaptando as regras à medida que as tecnologias se desenvolvem.',
  },
};

const questionTranslations = {
  'economic-1': 'Impostos mais altos sobre fortunas muito grandes se justificam para financiar serviços disponíveis a todos.',
  'economic-2': 'Em geral, as empresas devem definir salários e preços por meio da concorrência, em vez de controles governamentais.',
  'economic-3': 'Reduzir a distância entre ricos e pobres deve ser um dos principais objetivos da política econômica.',
  'economic-4': 'Prestadores privados devem ter liberdade para competir com os serviços públicos em igualdade de condições.',
  'economic-5': 'Os trabalhadores devem ter voz garantida nas principais decisões de grandes empregadores.',
  'economic-6': 'Manter os impostos baixos costuma ser uma forma melhor de elevar o padrão de vida do que ampliar os gastos públicos.',

  'authority-1': 'As pessoas devem ter liberdade para criticar o governo, mesmo quando suas opiniões sejam consideradas profundamente ofensivas pelo público.',
  'authority-2': 'A polícia deve ter poderes mais amplos de vigilância quando isso puder prevenir crimes graves.',
  'authority-3': 'Os adultos devem ter liberdade para fazer escolhas pessoais cujos riscos recaiam principalmente sobre eles mesmos.',
  'authority-4': 'Limitações temporárias a reuniões públicas podem se justificar quando as autoridades preveem graves perturbações da ordem.',
  'authority-5': 'Em geral, o acesso do governo às mensagens privadas de uma pessoa deve ser previamente autorizado pela Justiça.',
  'authority-6': 'Durante uma grave crise nacional, o Poder Executivo deve ter poderes mais amplos para agir rapidamente.',

  'governance-1': 'Os cidadãos devem ter mais oportunidades de votar diretamente sobre as principais decisões públicas.',
  'governance-2': 'Especialistas independentes devem ter a palavra final sobre políticas públicas de alta complexidade técnica.',
  'governance-3': 'Uma amostra representativa de cidadãos comuns deve ajudar a formular as principais propostas de políticas públicas.',
  'governance-4': 'Algumas políticas de longo prazo devem ser protegidas das pressões eleitorais por órgãos técnicos independentes.',
  'governance-5': 'Representantes eleitos devem poder contrariar as decisões de órgãos especializados quando os eleitores exigirem outra direção.',
  'governance-6': 'As qualificações profissionais devem pesar mais do que o apoio popular na escolha de dirigentes de órgãos técnicos.',

  'diplomacy-1': 'Os países devem aceitar alguns limites à liberdade de ação nacional para que os acordos internacionais sejam eficazes.',
  'diplomacy-2': 'O governo eleito de um país deve ter a palavra final quando as regras internacionais entrarem em conflito com as prioridades internas.',
  'diplomacy-3': 'Problemas globais compartilhados justificam dar às instituições internacionais poderes mais fortes para fazer cumprir as regras.',
  'diplomacy-4': 'Os países devem continuar livres para sair de acordos internacionais que deixem de atender a seus interesses.',
  'diplomacy-5': 'Países com mais recursos devem contribuir mais para resolver problemas além de suas próprias fronteiras.',
  'diplomacy-6': 'Proteger a capacidade de um país de tomar suas próprias decisões é mais importante do que estabelecer regras internacionais uniformes.',

  'force-1': 'Os governos devem investir mais na prevenção de conflitos e na negociação, mesmo que isso deixe menos recursos para as Forças Armadas.',
  'force-2': 'Forças Armadas fortes são uma das formas mais confiáveis de desencorajar agressões estrangeiras.',
  'force-3': 'A ação militar deve ser o último recurso, após o esgotamento de alternativas diplomáticas sérias.',
  'force-4': 'A intervenção militar pode se justificar para deter ameaças graves antes que cheguem às fronteiras de um país.',
  'force-5': 'Aceitar um acordo difícil costuma ser preferível a intensificar um conflito internacional.',
  'force-6': 'Manter a superioridade militar justifica um gasto público elevado.',

  'borders-1': 'As pessoas devem ter mais oportunidades de se mudar legalmente para outro país para trabalhar.',
  'borders-2': 'Os níveis de imigração devem ser limitados quando a moradia e os serviços públicos estiverem sob pressão.',
  'borders-3': 'Residentes de longa duração devem ter um caminho claro e acessível para obter a cidadania.',
  'borders-4': 'Um país deve estabelecer limites anuais rígidos para o número de novos residentes permanentes que aceita.',
  'borders-5': 'Os países devem facilitar a solicitação de proteção por refugiados por vias seguras e legais.',
  'borders-6': 'As regras de admissão devem favorecer fortemente candidatos cujas habilidades atendam às necessidades econômicas do país.',

  'culture-1': 'As leis devem se adaptar para reconhecer novas formas de vida familiar.',
  'culture-2': 'Quando a sociedade considera mudanças, os costumes estabelecidos devem ter uma forte presunção a seu favor.',
  'culture-3': 'As instituições públicas devem atualizar as normas sociais quando isso der às pessoas mais liberdade para viver como escolherem.',
  'culture-4': 'As escolas devem dar grande importância à transmissão dos valores tradicionais da sociedade.',
  'culture-5': 'Uma prática deve estar aberta a mudanças mesmo quando faz parte de uma cultura há gerações.',
  'culture-6': 'Mudanças rápidas nas expectativas sociais podem enfraquecer os laços compartilhados de que uma comunidade precisa.',

  'religion-1': 'As leis devem ser justificadas por razões que não dependam da aceitação de uma religião específica.',
  'religion-2': 'A herança religiosa de um país deve ajudar a orientar suas políticas públicas.',
  'religion-3': 'As escolas públicas devem ensinar sobre religiões sem promover uma fé em detrimento das outras.',
  'religion-4': 'Líderes religiosos devem ter um papel reconhecido nos debates públicos sobre questões morais.',
  'religion-5': 'As instituições governamentais devem evitar práticas religiosas oficiais.',
  'religion-6': 'O financiamento público de serviços deve contemplar organizações que seguem ensinamentos religiosos.',

  'environment-1': 'Proteger os ecossistemas pode justificar a rejeição de projetos que, de outra forma, gerariam crescimento econômico expressivo.',
  'environment-2': 'As regras ambientais devem ser flexibilizadas quando tornarem a energia básica e a moradia muito menos acessíveis financeiramente.',
  'environment-3': 'Os governos devem estabelecer limites ambientais firmes mesmo quando alguns setores econômicos precisarem diminuir de tamanho.',
  'environment-4': 'A criação de empregos deve geralmente ter prioridade quando os impactos ambientais forem limitados e puderem ser administrados.',
  'environment-5': 'As pessoas em sociedades ricas devem aceitar consumir menos bens materiais para reduzir os danos ambientais.',
  'environment-6': 'O crescimento econômico deve continuar sendo um objetivo central das políticas públicas mesmo quando aumentar o uso de recursos naturais.',

  'justice-1': 'As prisões devem destinar mais recursos à educação e ao tratamento que ajudem as pessoas a evitar novos crimes.',
  'justice-2': 'As sentenças devem impor uma punição significativa mesmo quando for improvável que a pessoa volte a cometer crimes.',
  'justice-3': 'Para muitas infrações não violentas, programas comunitários supervisionados são preferíveis à prisão.',
  'justice-4': 'Penas mais longas se justificam quando expressam claramente a condenação da sociedade aos crimes graves.',
  'justice-5': 'O progresso demonstrado por uma pessoa em sua reabilitação deve ter grande peso nas decisões sobre sua libertação.',
  'justice-6': 'A reincidência deve geralmente resultar em penas mais severas, mesmo quando o tratamento continua disponível.',

  'structure-1': 'As comunidades locais devem ter mais controle sobre como o dinheiro público é gasto em sua área.',
  'structure-2': 'As normas nacionais devem estabelecer padrões consistentes para os principais serviços públicos em todas as regiões.',
  'structure-3': 'Os governos regionais devem ter liberdade para experimentar políticas diferentes mesmo quando os resultados variarem entre as regiões do país.',
  'structure-4': 'O governo nacional deve coordenar as principais decisões de infraestrutura, em vez de deixá-las a cargo das autoridades locais.',
  'structure-5': 'As decisões devem ser tomadas no nível mais local que tenha condições razoáveis de colocá-las em prática.',
  'structure-6': 'Reunir uma parcela maior da arrecadação tributária em âmbito nacional é preferível a permitir que as regiões retenham a maior parte do que arrecadam.',

  'technology-1': 'Novas tecnologias de grande capacidade devem atender a requisitos claros de segurança antes de serem amplamente disponibilizadas.',
  'technology-2': 'A sociedade costuma se beneficiar quando as pessoas podem experimentar novas tecnologias antes de existirem regras detalhadas.',
  'technology-3': 'É razoável desacelerar a adoção de uma tecnologia quando seus riscos de longo prazo são pouco compreendidos.',
  'technology-4': 'Adiar inovações úteis pode causar mais danos do que aceitar alguma incerteza sobre seus riscos.',
  'technology-5': 'Desenvolvedores de tecnologias de alto impacto devem demonstrar que os principais riscos podem ser administrados antes da adoção em larga escala.',
  'technology-6': 'Os governos devem facilitar o lançamento de tecnologias emergentes, mesmo que a regulamentação precise ser atualizada depois.',
};

export const axes = englishAxes.map(axis => {
  const translatedAxis = axisTranslations[axis.id];
  if (!translatedAxis) throw new Error(`Missing pt-BR axis translation: ${axis.id}`);
  for (const field of ['name', 'left', 'right', 'description', 'leftDescription', 'rightDescription']) {
    if (typeof translatedAxis[field] !== 'string' || !translatedAxis[field].trim()) throw new Error(`Missing pt-BR axis translation: ${axis.id}.${field}`);
  }
  return { ...axis, ...translatedAxis };
});

export const questions = englishQuestions.map(question => {
  const translatedQuestion = questionTranslations[question.id];
  if (typeof translatedQuestion !== 'string' || !translatedQuestion.trim()) throw new Error(`Missing pt-BR question translation: ${question.id}`);
  return { ...question, text: translatedQuestion };
});
