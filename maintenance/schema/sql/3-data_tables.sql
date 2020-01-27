-- tables
CREATE TABLE "search".case_search_documents (
	document jsonb, 
	full_text_search_document TSVECTOR NOT NULL,
	case_name_search_document TSVECTOR NOT NULL
);

CREATE TABLE "search".legislation_documents (
	title TEXT,
	search_document TSVECTOR NOT NULL
);

CREATE TABLE "search".legislation_act_section_documents (
	title TEXT,
	section TEXT
);

-- full text indices
CREATE INDEX idx_case_search_documents_full_text_search_document 
ON "search".case_search_documents
USING GIN ("full_text_search_document");

CREATE INDEX idx_case_search_documents_case_name_search_document
ON "search".case_search_documents
USING GIN ("case_name_search_document");

CREATE INDEX idx_legislation_documents_search_document
ON "search".legislation_documents
USING GIN ("search_document");

CREATE INDEX idx_legislation_act_section_documents_section
ON "search".legislation_act_section_documents("section");

-- json indices
CREATE INDEX idx_case_search_documents_document_case_name
ON "search".case_search_documents(("document"->>'case_name'));

-- insert triggers to create documents
CREATE TRIGGER trg_create_document_vector 
BEFORE INSERT
ON "search".case_search_documents
FOR EACH ROW EXECUTE PROCEDURE "search".create_document_vectors();
	
