const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const PROJECTS_FILE = path.join(__dirname, '../data/projects.json');

// Funções auxiliares
const getProjects = () => {
  try {
    const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Listar projetos públicos
router.get('/public', (req, res) => {
  try {
    const projects = getProjects();
    const publicProjects = projects.filter(p => p.isPublic);

    // Buscar informações do usuário para cada projeto
    const usersFile = path.join(__dirname, '../data/users.json');
    let users = [];
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }

    const projectsWithAuthor = publicProjects.map(project => {
      const author = users.find(u => u.id === project.userId);
      return {
        ...project,
        authorName: author ? author.name : 'Usuário Desconhecido',
        data: undefined // Não enviar dados completos na listagem
      };
    });

    res.json({
      projects: projectsWithAuthor.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
    });
  } catch (error) {
    console.error('Erro ao listar projetos públicos:', error);
    res.status(500).json({ error: 'Erro ao listar projetos públicos.' });
  }
});

// Buscar projeto público específico
router.get('/public/:id', (req, res) => {
  try {
    const projectId = req.params.id;
    const projects = getProjects();

    const project = projects.find(p => p.id === projectId && p.isPublic);

    if (!project) {
      return res.status(404).json({ error: 'Projeto público não encontrado.' });
    }

    // Buscar informações do autor
    const usersFile = path.join(__dirname, '../data/users.json');
    let users = [];
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }

    const author = users.find(u => u.id === project.userId);

    res.json({
      project: {
        ...project,
        authorName: author ? author.name : 'Usuário Desconhecido'
      }
    });
  } catch (error) {
    console.error('Erro ao buscar projeto público:', error);
    res.status(500).json({ error: 'Erro ao buscar projeto público.' });
  }
});

module.exports = router;
