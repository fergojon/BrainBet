/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from '../models/types.js';

/**
 * Pre-defined premium question bank to seed the database
 */
export const SEED_QUESTIONS: Omit<Question, 'created_at'>[] = [
  // BlockChain & Web3 (Easy)
  {
    id: 'q-web3-01',
    question: 'Who published the Bitcoin Whitepaper in 2008 under the pseudonym Satoshi Nakamoto?',
    option_a: 'Vitalik Buterin',
    option_b: 'Satoshi Nakamoto',
    option_c: 'Hal Finney',
    option_d: 'Nick Szabo',
    correct_option: 'B',
    difficulty: 'easy',
    category: 'Web3 & Blockchain',
    reward: 10
  },
  {
    id: 'q-web3-02',
    question: 'What is the native cryptocurrency of the Ethereum network used to pay transaction fees?',
    option_a: 'Ether (ETH)',
    option_b: 'GasCoin',
    option_c: 'Solana (SOL)',
    option_d: 'Tether (USDT)',
    correct_option: 'A',
    difficulty: 'easy',
    category: 'Web3 & Blockchain',
    reward: 10
  },
  // Blockchain & Web3 (Medium)
  {
    id: 'q-web3-03',
    question: 'Which consensus mechanism does Ethereum currently use after completing "The Merge"?',
    option_a: 'Proof of Work (PoW)',
    option_b: 'Proof of History (PoH)',
    option_c: 'Proof of Stake (PoS)',
    option_d: 'Delegated Proof of Importance',
    correct_option: 'C',
    difficulty: 'medium',
    category: 'Web3 & Blockchain',
    reward: 20
  },
  {
    id: 'q-web3-04',
    question: 'What does "DeFi" stand for in the blockchain and cryptocurrency ecosystems?',
    option_a: 'Deferred Finance',
    option_b: 'Decentralized Finance',
    option_c: 'Democratic Fiduciary',
    option_d: 'Deflationary Investing',
    correct_option: 'B',
    difficulty: 'easy',
    category: 'Web3 & Blockchain',
    reward: 10
  },
  {
    id: 'q-web3-05',
    question: 'Which token standard is primarily used for creating non-fungible tokens (NFTs) on Ethereum?',
    option_a: 'ERC-20',
    option_b: 'ERC-721',
    option_c: 'ERC-1155',
    option_d: 'ERC-777',
    correct_option: 'B',
    difficulty: 'medium',
    category: 'Web3 & Blockchain',
    reward: 20
  },

  // AI & Neural Networks (Easy)
  {
    id: 'q-ai-01',
    question: 'What does the abbreviation "GPT" stand for in modern AI language models?',
    option_a: 'General Processing Transformer',
    option_b: 'Generative Pre-trained Transformer',
    option_c: 'Global Predictive Technology',
    option_d: 'Graphical Probability Tree',
    correct_option: 'B',
    difficulty: 'easy',
    category: 'AI & Machine Learning',
    reward: 10
  },
  {
    id: 'q-ai-02',
    question: 'Which tech company initially introduced the revolutionary "Transformer" architecture in 2017?',
    option_a: 'Google',
    option_b: 'OpenAI',
    option_c: 'Meta',
    option_d: 'Microsoft',
    correct_option: 'A',
    difficulty: 'medium',
    category: 'AI & Machine Learning',
    reward: 20
  },
  // AI & Neural Networks (Hard)
  {
    id: 'q-ai-03',
    question: 'In deep learning, what term refers to the problem where gradients become extremely small, preventing weights from changing?',
    option_a: 'Exploding Gradients',
    option_b: 'Vanishing Gradients',
    option_c: 'Dropout Overfitting',
    option_d: 'Stochastic Plateau',
    correct_option: 'B',
    difficulty: 'hard',
    category: 'AI & Machine Learning',
    reward: 35
  },
  {
    id: 'q-ai-04',
    question: 'What is the term for when an AI model begins generating convincing-sounding but entirely false or ungrounded claims?',
    option_a: 'Delusional drift',
    option_b: 'Hallucination',
    option_c: 'Model breakdown',
    option_d: 'Regression bias',
    correct_option: 'B',
    difficulty: 'easy',
    category: 'AI & Machine Learning',
    reward: 10
  },

  // Space & Cosmos (Medium)
  {
    id: 'q-cosmos-01',
    question: 'Which spacecraft, launched in 1977, is the farthest human-made object from Earth?',
    option_a: 'Voyager 1',
    option_b: 'Voyager 2',
    option_c: 'New Horizons',
    option_d: 'Pioneer 10',
    correct_option: 'A',
    difficulty: 'medium',
    category: 'Space & Cosmos',
    reward: 20
  },
  {
    id: 'q-cosmos-02',
    question: 'What is the term for the boundary surrounding a black hole from which nothing, not even light, can escape?',
    option_a: 'Event Horizon',
    option_b: 'Schwarzschild Limit',
    option_c: 'Singularity Edge',
    option_d: 'Accretion Threshold',
    correct_option: 'A',
    difficulty: 'easy',
    category: 'Space & Cosmos',
    reward: 10
  },
  {
    id: 'q-cosmos-03',
    question: 'Which fundamental force is responsible for keeping planets in orbit around stars?',
    option_a: 'Electromagnetic force',
    option_b: 'Weak nuclear force',
    option_c: 'Strong nuclear force',
    option_d: 'Gravitational force',
    correct_option: 'D',
    difficulty: 'easy',
    category: 'Space & Cosmos',
    reward: 10
  },
  {
    id: 'q-cosmos-04',
    question: 'Approximately how long does it take for light from the Sun to reach the Earth?',
    option_a: '8 seconds',
    option_b: '8 minutes',
    option_c: '8 hours',
    option_d: '8 days',
    correct_option: 'B',
    difficulty: 'medium',
    category: 'Space & Cosmos',
    reward: 20
  },

  // General Tech History & Trivia (Medium / Hard)
  {
    id: 'q-tech-01',
    question: 'Which programming language was created by Brendan Eich in just 10 days in 1995?',
    option_a: 'Java',
    option_b: 'JavaScript',
    option_c: 'Python',
    option_d: 'Ruby',
    correct_option: 'B',
    difficulty: 'medium',
    category: 'Tech Trivia',
    reward: 20
  },
  {
    id: 'q-tech-02',
    question: 'What was the name of the first widely-used commercial graphical web browser, released in 1993?',
    option_a: 'Netscape Navigator',
    option_b: 'WorldWideWeb',
    option_c: 'Mosaic',
    option_d: 'Internet Explorer',
    correct_option: 'C',
    difficulty: 'hard',
    category: 'Tech Trivia',
    reward: 35
  },
  {
    id: 'q-tech-03',
    question: 'What does "SOLID" stand for in object-oriented software design?',
    option_a: 'A set of design principles for making software more understandable, flexible, and maintainable',
    option_b: 'A data storage format designed for high-concurrency systems',
    option_c: 'An acronym for Secure Object Lifecycle in Database development',
    option_d: 'A programming language designed by Bell Labs',
    correct_option: 'A',
    difficulty: 'medium',
    category: 'Tech Trivia',
    reward: 20
  }
];

/**
 * Seeds the database if the question list is empty.
 * Runs atomically within the engine database context.
 */
export function seedDatabase(dbInstance: { questions: Question[] }): boolean {
  if (dbInstance.questions && dbInstance.questions.length > 0) {
    return false; // Already seeded
  }

  const seededQuestions: Question[] = SEED_QUESTIONS.map(q => ({
    ...q,
    created_at: new Date().toISOString()
  }));

  dbInstance.questions = seededQuestions;
  return true;
}
