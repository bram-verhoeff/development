Write {{count}} different post(s) for {{platform}} for the brand below.

<brand_profile>
{{brand_profile}}
</brand_profile>

<platform_rules platform="{{platform}}">
Style: {{style}}
Length of hook + body + hashtags combined: aim for {{target_min}}–{{target_max}} characters; the hard maximum is {{max_chars}}.
Number of hashtags: {{hashtags_min}}–{{hashtags_max}}.
</platform_rules>

{{source_block}}

{{instructions_block}}

Language of the posts: {{language}}.

For each post return:
- "hook": the opening line(s) that grab attention (this is published as the first line of the post),
- "body": the rest of the post text, without the hook and without hashtags,
- "hashtags": the hashtags as a list.
