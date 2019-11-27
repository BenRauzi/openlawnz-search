echo '\t
\pset format unaligned
WITH case_json_cte (case_id,block_id,case_json) AS (  
	SELECT 
		case_id,
		block_id,
		ROW_TO_JSON(ROWS)
	FROM
	(
		SELECT
			ROUND(a.id,-2) AS block_id,
			a.id AS case_id,
			a.CASE_DATE,
			a.CASE_NAME,
			a.CASE_TEXT,
			a.legislation
		FROM (
			SELECT ca.*, (SELECT JSONB_AGG(SUB) FROM
						(
							SELECT 
								l.title,
								l2c.SECTION
							FROM cases.legislation_to_cases l2c
							INNER JOIN cases.legislation l
								ON l2c.legislation_id=l.id
							WHERE l2c.case_id=cA.id
						) AS SUB) AS legislation
			FROM cases.cases.CASES ca
			ORDER BY ca.id
		) a
	) ROWS
)
SELECT JSONB_AGG(ct1.case_json)
FROM case_json_cte ct1
GROUP BY ct1.block_id
ORDER BY ct1.block_id;
' | sudo -u postgres psql -d cases | sed '1,2d' > full_documents.json
