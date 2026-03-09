import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App Component Initialization', () => {
    it('renders the application without crashing', () => {
        // Render the root component
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );

        // Basic verification that some element renders
        expect(document.body).not.toBeEmptyDOMElement();
    });
});
