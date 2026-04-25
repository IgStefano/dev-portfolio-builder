from schemas import (
    About,
    BlogPostStub,
    BlogSection,
    GeneratedSite,
    GitHubProfile,
    Hero,
    ProjectCard,
    RepoInfo,
)

SAMPLE_PROFILE = GitHubProfile(
    username="octocat",
    name="The Octocat",
    avatar_url="https://avatars.githubusercontent.com/u/583231?v=4",
    bio="GitHub mascot and friendly feline. I love open source!",
    location="San Francisco, CA",
    blog="https://github.blog",
    public_repos=8,
    followers=12345,
    top_repos=[
        RepoInfo(
            name="hello-world",
            description="My first repository on GitHub!",
            url="https://github.com/octocat/hello-world",
            stars=2500,
            language="Python",
        ),
        RepoInfo(
            name="Spoon-Knife",
            description="This repo is for demonstration purposes.",
            url="https://github.com/octocat/Spoon-Knife",
            stars=1200,
            language="HTML",
        ),
        RepoInfo(
            name="git-consortium",
            description="Consortium tools for git workflows.",
            url="https://github.com/octocat/git-consortium",
            stars=800,
            language="TypeScript",
        ),
        RepoInfo(
            name="octocat.github.io",
            description="Personal site and blog.",
            url="https://github.com/octocat/octocat.github.io",
            stars=450,
            language="JavaScript",
        ),
        RepoInfo(
            name="linguist",
            description="Language detection library for GitHub.",
            url="https://github.com/octocat/linguist",
            stars=300,
            language="Ruby",
        ),
        RepoInfo(
            name="test-repo",
            description="A simple test repository.",
            url="https://github.com/octocat/test-repo",
            stars=50,
            language="Go",
        ),
    ],
    languages=["Python", "HTML", "TypeScript", "JavaScript", "Ruby", "Go"],
    profile_readme="# Hi, I'm The Octocat!\n\nI love building things on GitHub.",
)

SAMPLE_GENERATED_SITE = GeneratedSite(
    hero=Hero(
        headline="The Octocat — Developer",
        subheadline=(
            "Full-stack engineer and open-source enthusiast based in "
            "San Francisco. Building tools that make developers' lives better."
        ),
    ),
    about=About(
        text=(
            "I'm a passionate developer with a love for open source and "
            "community-driven software. With expertise spanning Python, "
            "TypeScript, and Ruby, I enjoy building elegant solutions to "
            "complex problems. When I'm not coding, you can find me "
            "contributing to the GitHub ecosystem and mentoring new developers."
        ),
    ),
    projects=[
        ProjectCard(
            title="hello-world",
            description=(
                "A foundational repository that demonstrates the basics of "
                "version control and collaborative development on GitHub."
            ),
            url="https://github.com/octocat/hello-world",
            tags=["Python", "Open Source", "Tutorial"],
        ),
        ProjectCard(
            title="Spoon-Knife",
            description=(
                "An interactive demonstration repository designed to help "
                "newcomers learn the fork-and-pull workflow."
            ),
            url="https://github.com/octocat/Spoon-Knife",
            tags=["HTML", "Demo", "Git Workflow"],
        ),
        ProjectCard(
            title="git-consortium",
            description=(
                "A suite of tools for managing complex git workflows across "
                "large engineering teams and organizations."
            ),
            url="https://github.com/octocat/git-consortium",
            tags=["TypeScript", "DevTools", "Git"],
        ),
        ProjectCard(
            title="octocat.github.io",
            description=(
                "A personal site and blog showcasing projects, writing, and "
                "thoughts on the evolving developer ecosystem."
            ),
            url="https://github.com/octocat/octocat.github.io",
            tags=["JavaScript", "Blog", "Personal"],
        ),
    ],
    blog=BlogSection(
        heading="Latest Posts",
        posts=[
            BlogPostStub(
                title="Why Open Source Matters More Than Ever",
                summary=(
                    "Reflections on how open-source collaboration is shaping "
                    "the future of software development."
                ),
                date="2025-03-15",
            ),
            BlogPostStub(
                title="My Favorite Git Workflows for Large Teams",
                summary=(
                    "A practical guide to branching strategies and code review "
                    "practices that scale."
                ),
                date="2025-02-28",
            ),
            BlogPostStub(
                title="Getting Started with TypeScript in 2025",
                summary=(
                    "Tips and tricks for adopting TypeScript in your next "
                    "project, from someone who's been through the transition."
                ),
                date="2025-01-10",
            ),
        ],
    ),
)
