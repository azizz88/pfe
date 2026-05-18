package com.aziz.employeeservice.services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Extrait le texte brut d'un CV au format PDF ou DOCX.
 * Le texte normalisé (lowercase, espaces collapsés) sert ensuite au keyword matching.
 */
@Component
public class CvTextExtractor {

    /**
     * Retourne le texte brut du CV. Lève IllegalArgumentException si le format n'est pas supporté.
     */
    public String extract(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier CV vide");
        }
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        if (name.endsWith(".pdf") || contentType.contains("pdf")) {
            return extractPdf(file.getInputStream());
        }
        if (name.endsWith(".docx") || contentType.contains("wordprocessingml")) {
            return extractDocx(file.getInputStream());
        }
        if (name.endsWith(".txt") || contentType.startsWith("text/")) {
            return new String(file.getBytes());
        }
        throw new IllegalArgumentException("Format CV non supporté (PDF, DOCX ou TXT requis)");
    }

    /** Normalise le texte pour le matching : minuscules + espaces compactés. */
    public String normalize(String raw) {
        if (raw == null) return "";
        return raw.toLowerCase()
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String extractPdf(InputStream is) throws Exception {
        try (PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(doc);
        }
    }

    private String extractDocx(InputStream is) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }
}
