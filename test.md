
Great! Since you’re using VS Code on Windows, you can use its powerful Find and Replace with Regex feature to fix the Yup.when() syntax issues systematically across your project.

Here’s how to proceed:

1. Open the Search Panel

	•	Press Ctrl + Shift + F to open the Find in Files panel.

2. Search for the Old when() Syntax

To find all instances of the old .when() syntax, use this Regex pattern:

\.when\((['"][^'"]+['"])\s*,\s*\{([^}]+)\}\)

This pattern matches:
	•	The field being used in when() (e.g., 'isShared').
	•	The {} object containing is, then, and otherwise.

3. Replace with the New Syntax

Use this as the Replace pattern:

.when($1, ($1, schema) => $1 === 'true' ? schema.required() : schema.notRequired())

4. Perform a Dry Run

	•	In the search results, carefully review the matches before replacing them.
	•	Test the replacement on a few files to ensure it works as expected.

5. Replace in All Files

	•	Click the Replace All button (Alt + Enter) after confirming the changes.

6. Handle Variations

If there are variations in how .when() is used (e.g., different field names or conditions), adjust the regex accordingly for each variation. For instance:
	•	If conditions are more complex (e.g., is: (val) => val > 5), you might need to refine your regex or fix those cases manually.

Example: Before and After

Before:

sharedWith: Yup.string()
  .nullable()
  .when('isShared', {
    is: (val) => val === 'true',
    then: Yup.string().nullable().required('FILTER_ADD_FER001_SHARED_WITH'),
    otherwise: Yup.string().nullable().notRequired(),
  })

After:

sharedWith: Yup.string()
  .nullable()
  .when('isShared', (isShared, schema) =>
    isShared === 'true'
      ? schema.required('FILTER_ADD_FER001_SHARED_WITH')
      : schema.notRequired()
  )

7. Test Your Changes

After making replacements:
	1.	Run your application and ensure the updated Yup validations work correctly.
	2.	Check for edge cases or any validation rules you might have missed.

Let me know if you need further assistance setting up or refining the process!