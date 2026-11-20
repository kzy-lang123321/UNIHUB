import { Course } from "../../types";
export const institution = {
  id: "akl",
  name: "Akl Postgraduate College",
  location: "Matta, Swat",
};
export const catalog = [
  {
    code: "CS-101",
    title: "Programming Fundamentals",
    credit: 3,
    programId: "bs-cs",
    semester: 1,
  },
];
export const seedCourse: Course = {
  ...catalog[0]!,
  institutionId: "akl",
  teacherIds: [],
  published: true,
  creditLine: "UniHub original demonstration material",
  outline:
    "Sample outline — institution must verify against the adopted HEC/university syllabus before publication.",
  books: [
    {
      title: "Think Python",
      type: "open",
      edition: "2nd edition",
      url: "https://greenteapress.com/wp/think-python-2e/",
    },
    {
      title: "C++ How to Program",
      type: "linked",
      edition: "10th edition",
      url: "https://www.pearson.com/",
    },
  ],
  units: [
    {
      no: 1,
      title: "Thinking like a programmer",
      notes:
        "An algorithm is a finite sequence of clear steps that solves a problem. Start by identifying inputs, the required output, and the transformations between them.\n\nExample: to average two numbers, read a and b, calculate (a + b) / 2, then display the result. Test with equal numbers, zero, and negative values.",
      urdu: "الگورتھم کسی مسئلے کو حل کرنے کے لیے واضح اور محدود مراحل کا مجموعہ ہے۔",
      pashto:
        "الګوریتم د یوې ستونزې د حل لپاره د روښانه او محدودو ګامونو لړۍ ده.",
      mcqs: [
        {
          question: "Which property must an algorithm have?",
          options: [
            "Infinite steps",
            "Finite steps",
            "No input ever",
            "Only one variable",
          ],
          answer: 1,
          explanation:
            "An algorithm must terminate after a finite number of steps.",
        },
      ],
      sq: ["Define an algorithm."],
      lq: [
        "Design and trace an algorithm to find the largest of three numbers.",
      ],
    },
    {
      no: 2,
      title: "Variables & data types",
      notes:
        "A variable associates a name with a value. Choose a data type that represents the values you need: integers for whole numbers, floating point for approximate decimals, and booleans for true or false conditions.",
      mcqs: [
        {
          question: "Which type represents true or false?",
          options: ["Integer", "String", "Boolean", "Float"],
          answer: 2,
          explanation: "Boolean values represent logical truth.",
        },
      ],
      sq: ["What is a variable?"],
      lq: ["Compare integers and floating point values with examples."],
    },
    {
      no: 3,
      title: "Decisions & loops",
      notes:
        "Conditionals select a path based on a boolean expression. Loops repeat work. Always identify the condition that makes a loop stop.",
      mcqs: [],
      sq: ["What is a loop?"],
      lq: ["Write pseudocode to sum the first n positive integers."],
    },
  ],
  papers: [
    {
      uni: "UniHub original practice",
      year: 2026,
      type: "Midterm",
      fileUrl: "",
      solutionUrl: "",
    },
  ],
};
