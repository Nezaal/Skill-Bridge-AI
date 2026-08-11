const {pipeline}  = require('@xenova/transformers');


let embedder = null ; 
async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

async function embedText(text) {
    const model = await getEmbedder();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}
function cosineSimilarity(vecA, vecB) {
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
    }
    return dot;
}
function similarityToScore(similarity) {
    const clamped = Math.max(0, Math.min(1, similarity));
    return Math.round(clamped * 100);
}
function extractKeywords(text) {
    const stopWords = new Set(['the','and','for','with','a','an','to','of','in','on','is','are','this','that']);
    return new Set(
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s+#.]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word))
    );
}
function findMissingSkills(resumeText, jobDescriptionText) {
    const resumeWords = extractKeywords(resumeText);
    const jdWords = extractKeywords(jobDescriptionText);

    const missing = [...jdWords].filter(word => !resumeWords.has(word));
    return missing.slice(0, 15);
}

async function computeMatchScore(resumeText, jobDescriptionText) {
    const [resumeVec, jdVec] = await Promise.all([
        embedText(resumeText),
        embedText(jobDescriptionText)
    ]);

    const similarity = cosineSimilarity(resumeVec, jdVec);
    const score = similarityToScore(similarity);
    const missingSkills = findMissingSkills(resumeText, jobDescriptionText);

    return { score, missingSkills };
}

module.exports = { computeMatchScore };