<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;

class HomeController extends AbstractController {

    /**
     * @Route ("/", name="home")
     */
    public function home (): \Symfony\Component\HttpFoundation\Response
    {
        return $this->render('home.html.twig', [
            'ws_url' => 'localhost:8080'
        ]);
    }
}