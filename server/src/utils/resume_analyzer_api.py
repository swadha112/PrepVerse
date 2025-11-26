import sys
import json
import re
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
from sentence_transformers import SentenceTransformer, util

sys.stderr = sys.__stderr__

def extract_skills(text, known_skills=None):
    if not known_skills:
        known_skills = set([
            "React", "Node.js", "REST", "Docker", "CI/CD", "Python", "Java", "AWS", "TypeScript", "C++", "SQL", "Redux",
            "Kubernetes", "Git", "HTML", "CSS", "JavaScript", "MongoDB", "Firebase", "Express", "Flask", "Tailwind", "SASS"
        ])
    found = set()
    text_lower = text.lower()
    for skill in known_skills:
        if skill.lower() in text_lower:
            found.add(skill)
    return list(found)

def detect_sections(text):
    # Expanded section list
    section_keywords = [
        "summary", "contact", "education", "skills", "projects", "experience", "certificates", "objective",
        "achievements", "activities", "languages", "hobbies"
    ]
    found = [kw.capitalize() for kw in section_keywords if kw in text.lower()]
    return found

def predict_role_and_industry(skills, job_role):
    it_roles = ["Frontend Developer", "Backend Developer", "Fullstack Developer", "UI Developer"]
    ds_roles = ["Data Scientist", "ML Engineer"]
    devops_roles = ["DevOps Engineer"]
    design_roles = ["UI Designer", "UX Designer"]
    # Match prediction logic
    fit_roles = []
    industry = "IT"
    exp_level = "Intern"
    skillset = set([s.lower() for s in skills])

    if "react" in skillset or "node.js" in skillset or "redux" in skillset:
        fit_roles = ["Frontend Intern", "Junior React Developer", "UI Developer"]
        exp_level = "Intern" if len(skills) < 4 else "Junior"
    elif "flask" in skillset or "python" in skillset or "mongo" in skillset:
        fit_roles = ["Backend Intern", "Python Developer", "Data Engineer"]
        exp_level = "Intern" if len(skills) < 5 else "Junior"
        industry = "Data Science"
    elif "devops" in skillset or "docker" in skillset or "ci/cd" in skillset:
        fit_roles = ["DevOps Intern", "Junior DevOps"]
        exp_level = "Intern" if len(skills) < 3 else "Junior"
        industry = "DevOps"
    if "design" in job_role.lower() or "ux" in skillset or "ui" in skillset:
        fit_roles.append("UI/UX Designer")
        industry = "Design"
    return {"roles": fit_roles or ["Frontend Intern"], "experienceLevel": exp_level, "industryFit": industry}

def check_grammar(text):
    # Basic grammar/spelling check; use NLP library for more accuracy
    lower = text.lower()
    spelling_errors = []
    # Simple spellcheck for common words
    common_misspellings = ["expereince", "proffesional", "recieve", "acheive", "teh", "enviroment"]
    for word in common_misspellings:
        if word in lower:
            spelling_errors.append(word)
    tense_errors = []
    # Check for tense issues (past/present not matching, very basic)
    if re.search(r"\b(build|create|lead)\b", lower) and re.search(r"\bworking|creating|leading\b", lower):
        tense_errors.append("Tense mismatch between action verbs.")

    punctuation_errors = []
    if "." not in text.strip():
        punctuation_errors.append("Missing sentence-ending punctuation.")

    return {
        "spellingErrors": spelling_errors,
        "tenseIssues": tense_errors,
        "punctuationIssues": punctuation_errors
    }

def main():
    data = json.loads(sys.stdin.read())
    resume_text = data.get('resumeText', '')
    job_desc = data.get('jobDesc', '')
    job_role = data.get('jobRole', '')

    model_name = "yashpwr/resume-ner-bert-v2"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForTokenClassification.from_pretrained(model_name)
    ner = pipeline("token-classification", model=model, tokenizer=tokenizer, aggregation_strategy="simple")
    entities = ner(resume_text)
    entity_summary = {}
    for ent in entities:
        ent_type = ent["entity_group"]
        word = ent["word"]
        entity_summary.setdefault(ent_type, []).append(word)
    resume_skills = entity_summary.get("SKILL", [])

    known_skills = set(resume_skills + [
        "React", "Node.js", "REST", "Docker", "CI/CD", "Python", "Java", "AWS", "TypeScript", "C++",
        "SQL", "Redux", "Kubernetes", "Git", "HTML", "CSS", "JavaScript", "MongoDB", "Firebase", "Express", "Flask", "Tailwind", "SASS"
    ])
    jd_skills = extract_skills(job_desc, known_skills)
    matched_skills = list(set(resume_skills) & set(jd_skills))
    missing_skills = list(set(jd_skills) - set(resume_skills))
    sections_detected = detect_sections(resume_text)

    model_score = SentenceTransformer("anass1209/resume-job-matcher-all-MiniLM-L6-v2")
    emb_resume = model_score.encode(resume_text, convert_to_tensor=True)
    emb_job = model_score.encode(job_desc, convert_to_tensor=True)
    ats_score = int(util.cos_sim(emb_resume, emb_job).item() * 100)

    def calc_score(text, keywords):
        present = [kw for kw in keywords if kw.lower() in text.lower()]
        return min(int(100 * (len(present) / max(1, len(keywords)))), 100)
    def calc_skills_score(matched, jd_skills):
        if not jd_skills:
            return 0
        return min(int(100 * len(matched) / len(jd_skills)), 100)
    section_score = min(int(100 * len(sections_detected) / 12), 100)
    skills_score = calc_skills_score(matched_skills, jd_skills)

    # Detailed block analysis
    nlp_analysis = []
    if matched_skills:
        nlp_analysis.append({"type": "success", "title": "Relevant Skills", "desc": f"Skills {', '.join(matched_skills)} match the job requirements."})
    else:
        nlp_analysis.append({"type": "fail", "title": "Missing Key Technical Skills", "desc": "No skills from your resume matched the job description. Please add relevant technical skills."})
    if section_score > 80:
        nlp_analysis.append({"type": "success", "title": "Resume Structure", "desc": "Your resume is well-organized with most standard sections included."})
    else:
        nlp_analysis.append({"type": "fail", "title": "Resume Structure Issues", "desc": "Some important resume sections (Skills, Education, Projects, Experience) are missing or hard to find."})
    if breakdown := {
        "toneAndStyle": calc_score(resume_text, ["collaborate", "team", "drive", "lead", "initiative", "agile"]),
        "content": calc_score(resume_text, ["increase", "reduce", "manage", "deliver", "optimize", "create", "build", "improve"]),
        "structure": section_score,
        "skills": skills_score,
    }:
        if breakdown["toneAndStyle"] < 50:
            nlp_analysis.append({"type": "fail", "title": "Tone & Professionalism", "desc": "The resume tone is too generic or vague. Add confident, energetic wording and avoid clichés."})
        else:
            nlp_analysis.append({"type": "success", "title": "Professional Tone", "desc": "The resume tone is highly professional and fits industry standards."})

        if breakdown["content"] < 50:
            nlp_analysis.append({"type": "fail", "title": "Achievements & Action Verbs", "desc": "Add results, achievements (numbers), and use more action verbs for experience/projects."})

    # Role, level, industry fit prediction
    fit_pred = predict_role_and_industry(resume_skills, job_role)

    # Grammar & spelling check
    grammar_info = check_grammar(resume_text)
    grammar_analysis = []
    if any(len(errors) > 0 for errors in grammar_info.values()):
        if grammar_info['spellingErrors']:
            grammar_analysis.append({"type": "fail", "title": "Spelling Issues", "desc": f"Check spelling for: {', '.join(grammar_info['spellingErrors'])}"})
        if grammar_info['tenseIssues']:
            grammar_analysis.append({"type": "fail", "title": "Verb/Tense Issues", "desc": ', '.join(grammar_info['tenseIssues'])})
        if grammar_info['punctuationIssues']:
            grammar_analysis.append({"type": "fail", "title": "Formatting/Punctuation", "desc": ', '.join(grammar_info['punctuationIssues'])})
    else:
        grammar_analysis.append({"type": "success", "title": "Grammar & Spelling", "desc": "No major grammar or spelling issues detected."})

    # Suggestions block
    suggestions = []

    # Always include actionable improvements
    if missing_skills:
        suggestions.append({"desc": f"Add these missing skills: {', '.join(missing_skills)}", "action": "highlight-skills"})
    if breakdown["content"] < 50:
        suggestions.append({"desc": "Add 2–3 measurable achievements to each job/project. Use numbers if possible.", "action": "improve-achievements"})
    if "Skills" not in sections_detected:
        suggestions.append({"desc": "Create a clear 'Skills' section and add all technologies/tools relevant to the role.", "action": "add-skills-section"})
    if ats_score < 70:
        suggestions.append({"desc": "Improve ATS score by adding keywords, removing tables/images, using simple formatting.", "action": "improve-ats"})
    if len(resume_text.split()) > 600:
        suggestions.append({"desc": "Resume should be max 1 page if you have < 3 years experience.", "action": "shorten-resume"})

    result = {
        "atsScore": ats_score,
        "issues": len(missing_skills),
        "skillsMatched": matched_skills,
        "skillsMissing": missing_skills,
        "entities": entity_summary,
        "breakdown": breakdown,
        "sectionsDetected": sections_detected,
        "nlpAnalysis": nlp_analysis,
        "fitPrediction": fit_pred,
        "grammarAnalysis": grammar_analysis,
        "suggestions": suggestions
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
