UPDATE "Role"
SET "permissions" = jsonb_set(
	"permissions"::jsonb,
	'{4}',
	CASE
		WHEN "isAdmin" THEN
			'{
				"url": "/products",
				"access": {
					"view": true,
					"adding": true,
					"editing": true,
					"removing": true,
					"viewProcess": true,
					"addingProcess": true,
					"editingProcess": true,
					"removingProcess": true,
					"changeDisabledProcess": true
				}
			}'::jsonb
		ELSE
			'{
				"url": "/products",
				"access": {
					"view": false,
					"adding": false,
					"editing": false,
					"removing": false,
					"viewProcess": false,
					"addingProcess": false,
					"editingProcess": false,
					"removingProcess": false,
					"changeDisabledProcess": false
				}
			}'::jsonb
	END,
	true
)
WHERE NOT ("permissions"::jsonb ? '4');
