"use client";

import React from 'react';

interface SchemaMarkupProps {
  data: Record<string, any>;
}

/**
 * SchemaMarkup Component
 * Injects JSON-LD structured data into the <head>
 */
const SchemaMarkup: React.FC<SchemaMarkupProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export default SchemaMarkup;
