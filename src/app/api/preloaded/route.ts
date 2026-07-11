import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PRELOADED_SUBJECTS } from "@/lib/subjects";
import { parseDocumentBuffer } from "@/lib/parser";

export const maxDuration = 60;

const SUPPORTED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
]);

// Sample content generator to populate the folders if they are empty
const SUBJECT_LECTURES: Record<string, Record<string, string>> = {
  cce: {
    "lecture1.pdf": `Lecture 1: Introduction to Civics & Active Citizenship. Civics is the study of the rights and duties of citizenship. An active citizen is someone who takes an active role in their community, society, and nation. The core values of active citizenship include responsibility, respect, tolerance, and civic participation. Civic engagement refers to the ways in which citizens participate in the life of a community in order to improve conditions for others or to help shape the community's future. Forms of civic engagement include voting, volunteering, community organizing, and participating in local government.`,
    "lecture2.pdf": `Lecture 2: Community Development & Project Planning. Community development is a process where community members come together to take collective action and generate solutions to common problems. Key principles of community development include participation, empowerment, ownership, inclusion, and sustainability. Effective project planning involves identifying needs, setting SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound), resource mapping, stakeholder analysis, and risk management. Evaluating projects ensures that objectives are met and lessons are learned for future initiatives.`,
    "lecture3.pdf": `Lecture 3: Human Rights, Diversity & Inclusion. Human rights are moral principles or norms for certain standards of human behavior and are protected as natural and legal rights. The Universal Declaration of Human Rights (UDHR) was adopted by the United Nations General Assembly in 1948. Diversity refers to the range of human differences, including race, ethnicity, gender, age, social class, and physical ability. Inclusion is the practice of providing equal access to opportunities and resources for people who might otherwise be excluded or marginalized.`,
    "lecture4.pdf": `Lecture 4: Social Responsibility & Corporate Citizenship. Social responsibility is an ethical framework which suggests that an entity, be it an organization or individual, has an obligation to act for the benefit of society at large. Corporate Social Responsibility (CSR) is a self-regulating business model that helps a company be socially accountable to itself, its stakeholders, and the public. Key areas of CSR include environmental sustainability, ethical labor practices, philanthropic giving, and volunteering.`,
    "lecture5.pdf": `Lecture 5: Public Policy, Civic Institutions & Governance. Public policy is the principled guide to action taken by the administrative executive branches of a state with regard to a class of issues, in a manner consistent with law and institutional customs. Governance refers to all processes of governing, whether undertaken by a government, market, or network, over a social system. Civic institutions like NGOs, community groups, and media play a critical role in holding governance structures accountable and advocating for public interest.`,
    "lecture6.pdf": `Lecture 6: Sustainable Development Goals (SDGs) & Local Actions. The SDGs are a collection of 17 global goals designed to be a blueprint to achieve a better and more sustainable future for all. They were set up in 2015 by the United Nations General Assembly and are intended to be achieved by the year 2030. Goals include Goal 1: No Poverty, Goal 4: Quality Education, Goal 5: Gender Equality, and Goal 13: Climate Action. Localizing the SDGs means translating these global goals into concrete actions at the community, city, and regional levels.`,
  },
  icp: {
    "lecture1.pdf": `Lecture 1: Ideological Basis of Pakistan & Two-Nation Theory. The ideology of Pakistan is rooted in the Islamic way of life and the realization that Muslims of the subcontinent are a distinct nation. The Two-Nation Theory is the basis of the struggle for Pakistan, stating that Hindus and Muslims are two distinct nations with different cultures, religions, and social values, and therefore cannot live peacefully under a single united state. Sir Syed Ahmed Khan was one of the earliest proponents of this concept, advocating for Muslim political representation and educational advancement.`,
    "lecture2.pdf": `Lecture 2: Allama Iqbal & Quaid-e-Azam's Vision of Pakistan. Allama Iqbal, the national poet-philosopher, presented the concept of a separate Muslim state in his famous Allahabad Address of 1930. He envisioned a homeland where Muslims could develop their spiritual and cultural life. Quaid-e-Azam Muhammad Ali Jinnah, the founder of Pakistan, translated this vision into reality through his political leadership. Jinnah's vision of Pakistan was a democratic state based on Islamic principles of social justice, equality, and protection of minority rights, as articulated in his August 11, 1947 speech.`,
    "lecture3.pdf": `Lecture 3: Constitutional History of Pakistan (1947-1973). After independence, Pakistan operated under the modified Government of India Act 1935. The Objectives Resolution, passed in 1949, laid down the foundational principles for future constitutions, declaring sovereignty belongs to Allah alone. Pakistan adopted its first constitution in 1956, declaring it an Islamic Republic. This was followed by the 1962 Constitution which established a presidential system. Finally, the current 1973 Constitution was enacted, establishing a federal parliamentary system.`,
    "lecture4.pdf": `Lecture 4: The 1973 Constitution of Pakistan: Salient Features. The 1973 Constitution is a written, rigid, and democratic constitution. Its salient features include a Federal Parliamentary System with a bicameral legislature (Senate and National Assembly). The President is the ceremonial head of state, while the Prime Minister is the head of government. It declares Islam as the state religion and establishes the Council of Islamic Ideology to ensure laws conform to Islamic injunctions. It also guarantees provincial autonomy while maintaining a strong center.`,
    "lecture5.pdf": `Lecture 5: Fundamental Rights & Principles of Policy in Pakistan. Part II, Chapter 1 of the 1973 Constitution guarantees Fundamental Rights to all citizens, including security of person, safeguards as to arrest and detention, freedom of movement, freedom of assembly, freedom of speech, and equality before the law. Chapter 2 outlines the Principles of Policy, which serve as guidelines for governance, including promotion of Islamic way of life, local government institution promotion, protection of family, and active participation of women in national life.`,
    "lecture6.pdf": `Lecture 6: Structure of Government: Executive, Legislature & Judiciary. The Government of Pakistan consists of three main branches. The Legislature is the Parliament (Majlis-e-Shoora), responsible for lawmaking. The Executive branch is headed by the Prime Minister and the Cabinet, responsible for executing laws and administration. The Judiciary is an independent branch headed by the Supreme Court of Pakistan, responsible for interpreting the Constitution, resolving disputes, and protecting fundamental rights.`,
  },
};

function isSupportedFile(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(extension);
}

function ensureDirectoryAndFiles(subjectId: string, dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const existingFiles = fs.readdirSync(dirPath).filter((fileName) => isSupportedFile(fileName));
  if (existingFiles.length > 0) {
    return;
  }

  const lectures = SUBJECT_LECTURES[subjectId];
  if (!lectures) return;

  for (const [fileName, content] of Object.entries(lectures)) {
    const filePath = path.join(dirPath, fileName);
    fs.writeFileSync(filePath, content, "utf-8");
  }
}

function listLectureFiles(dirPath: string) {
  return fs
    .readdirSync(dirPath)
    .filter((fileName) => isSupportedFile(fileName))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((fileName) => path.join(dirPath, fileName));
}

export async function POST(request: NextRequest) {
  try {
    const { subjectId } = await request.json();

    const subject = PRELOADED_SUBJECTS.find((s) => s.id === subjectId);
    if (!subject) {
      return NextResponse.json(
        { success: false, error: `Invalid subject ID: ${subjectId}` },
        { status: 400 }
      );
    }

    const dirPath = path.join(process.cwd(), "public", "preloaded", subjectId);
    ensureDirectoryAndFiles(subjectId, dirPath);

    const files = listLectureFiles(dirPath);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No lecture files found for this subject." },
        { status: 404 }
      );
    }

    let mergedText = "";
    const parsedFilesInfo = [];

    // Parse files sequentially to preserve ordering and trace errors
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const buffer = fs.readFileSync(filePath);
      const extractedText = await parseDocumentBuffer(buffer, fileName);

      if (extractedText && extractedText.length >= 50) {
        mergedText += `\n\n--- DOCUMENT: ${fileName} ---\n\n` + extractedText;
        parsedFilesInfo.push({ name: fileName, length: extractedText.length });
      }
    }

    mergedText = mergedText.trim();

    if (!mergedText || mergedText.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not extract enough study content from preloaded lectures.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: mergedText,
      charCount: mergedText.length,
      filesParsed: parsedFilesInfo,
      discoveredFiles: parsedFilesInfo.map((file) => file.name),
    });
  } catch (error) {
    console.error("Preloaded parse error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse preloaded lecture materials.",
      },
      { status: 500 }
    );
  }
}
